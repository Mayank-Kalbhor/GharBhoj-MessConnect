import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../../integrations/razorpay/razorpay.service';
import {
  CreateSubscriptionDto,
  SkipMealDto,
  RedeemSkipCreditDto,
  PauseSubscriptionDto,
  CancelSubscriptionDto,
  SwitchMessDto,
  SubscriptionFilterQueryDto
} from './dto/subscriptions.dto';
import {
  SubscriptionStatus,
  OrderStatus,
  OrderType,
  PaymentType,
  PaymentStatus,
  WalletTxnType,
  UserRole
} from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async createSubscription(customerId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: dto.planId, messId: dto.messId, isActive: true }
    });

    if (!plan) {
      throw new NotFoundException({
        code: ErrorCode.PLAN_NOT_FOUND,
        message: 'Subscription plan not found or not currently active.'
      });
    }

    // Business Logic Rule 2: totalMealsAllotted = durationDays × mealsPerDay
    const mealsPerDay = plan.mealTypes.length;
    const totalMealsAllotted = plan.durationDays * mealsPerDay;

    // Calendar date arithmetic: endDate = startDate + durationDays
    const startDateObj = new Date(dto.startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + plan.durationDays);

    const planPrice = new Decimal(plan.price.toString());
    const walletCredit = new Decimal(dto.walletCreditToApply || '0.00');

    if (walletCredit.gt(planPrice)) {
      throw new UnprocessableEntityException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Wallet credit to apply cannot exceed total plan price.'
      });
    }

    const netPayable = planPrice.minus(walletCredit);

    return this.prisma.$transaction(async (tx) => {
      // If wallet credit applied, verify balance and deduct atomically
      if (walletCredit.gt(0)) {
        const wallet = await tx.wallet.findUnique({ where: { userId: customerId } });
        if (!wallet || new Decimal(wallet.balance.toString()).lt(walletCredit)) {
          throw new UnprocessableEntityException({
            code: ErrorCode.INSUFFICIENT_WALLET_BALANCE,
            message: 'Insufficient wallet balance for credit deduction.'
          });
        }

        await tx.wallet.update({
          where: { userId: customerId },
          data: {
            balance: new Prisma.Decimal(new Decimal(wallet.balance.toString()).minus(walletCredit).toFixed(2))
          }
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: new Prisma.Decimal(walletCredit.toFixed(2)),
            type: WalletTxnType.DEBIT,
            reason: `Applied toward subscription plan ${plan.name}`
          }
        });
      }

      // Create subscription row (status starts ACTIVE once paid, or PENDING/ACTIVE)
      const subscription = await tx.subscription.create({
        data: {
          userId: customerId,
          messId: dto.messId,
          planId: dto.planId,
          startDate: startDateObj,
          endDate: endDateObj,
          status: SubscriptionStatus.ACTIVE,
          mealTypesIncluded: plan.mealTypes,
          totalMealsAllotted,
          mealsDelivered: 0,
          mealsSkipped: 0,
          skipCreditsRemaining: 0,
          balanceAmount: new Prisma.Decimal(netPayable.toFixed(2)),
          autoRenew: process.env.ENABLE_AUTO_RENEW === 'true' ? (dto.autoRenew || false) : false
        }
      });

      // Initiate Razorpay order if netPayable > 0
      let rzpOrderId: string | null = null;
      if (netPayable.gt(0)) {
        const amountInPaise = Math.round(netPayable.mul(100).toNumber());
        const rzpOrder = await this.razorpayService.createOrder({
          amountInPaise,
          receipt: `sub_${subscription.id.slice(0, 10)}`
        });
        rzpOrderId = rzpOrder.id;

        await tx.payment.create({
          data: {
            userId: customerId,
            subscriptionId: subscription.id,
            amount: new Prisma.Decimal(netPayable.toFixed(2)),
            currency: 'INR',
            type: PaymentType.SUBSCRIPTION_PAYMENT,
            status: PaymentStatus.PENDING,
            razorpayOrderId: rzpOrderId
          }
        });
      }

      return {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate.toISOString().split('T')[0],
        endDate: subscription.endDate.toISOString().split('T')[0],
        totalMealsAllotted: subscription.totalMealsAllotted,
        mealsDelivered: subscription.mealsDelivered,
        mealsSkipped: subscription.mealsSkipped,
        skipCreditsRemaining: subscription.skipCreditsRemaining,
        balanceAmount: subscription.balanceAmount.toString(),
        razorpayOrderId: rzpOrderId
      };
    });
  }

  async getSubscriptionById(userId: string, role: UserRole, id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        mess: { select: { id: true, name: true, ownerId: true } },
        plan: true,
        pauses: true
      }
    });

    if (!sub) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Subscription not found.' });
    }

    if (role === UserRole.CUSTOMER && sub.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized.' });
    }
    if (role === UserRole.VENDOR && sub.mess.ownerId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized.' });
    }

    return {
      ...sub,
      balanceAmount: sub.balanceAmount.toString(),
      startDate: sub.startDate.toISOString().split('T')[0],
      endDate: sub.endDate.toISOString().split('T')[0]
    };
  }

  async getSubscriptions(userId: string, role: UserRole, query: SubscriptionFilterQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {
      ...(query.status && { status: query.status })
    };

    if (role === UserRole.CUSTOMER) {
      where.userId = userId;
    } else if (role === UserRole.VENDOR) {
      const mess = await this.prisma.mess.findUnique({ where: { ownerId: userId } });
      if (!mess) return buildPaginatedResponse([], 0, page, limit);
      where.messId = mess.id;
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { plan: true, mess: { select: { name: true } } }
      })
    ]);

    const formatted = items.map(sub => ({
      ...sub,
      balanceAmount: sub.balanceAmount.toString(),
      startDate: sub.startDate.toISOString().split('T')[0],
      endDate: sub.endDate.toISOString().split('T')[0]
    }));

    return buildPaginatedResponse(formatted, totalItems, page, limit);
  }

  async skipMeal(customerId: string, subscriptionId: string, dto: SkipMealDto) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: customerId }
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
        message: 'Active subscription required to skip meals.'
      });
    }

    const skipDateObj = new Date(dto.date);

    // Verify cutoff time for this date's daily menu
    const dailyMenu = await this.prisma.dailyMenu.findFirst({
      where: {
        messId: sub.messId,
        date: skipDateObj
      }
    });

    if (dailyMenu && new Date() > dailyMenu.cutoffTime) {
      throw new UnprocessableEntityException({
        code: ErrorCode.CUTOFF_PASSED,
        message: `Cutoff time for ${dto.date} has passed. Skips are not permitted after cutoff.`
      });
    }

    return this.prisma.$transaction(
      async (tx) => {
      // Find or create the scheduled order for this day
      let order = await tx.order.findFirst({
        where: {
          subscriptionId: sub.id,
          scheduledDate: skipDateObj
        }
      });

      if (!order) {
        // Find user address
        const addr = await tx.address.findFirst({ where: { userId: customerId, isDefault: true } })
          || await tx.address.findFirst({ where: { userId: customerId } });

        order = await tx.order.create({
          data: {
            orderType: OrderType.SUBSCRIPTION_MEAL,
            userId: customerId,
            messId: sub.messId,
            subscriptionId: sub.id,
            addressId: addr ? addr.id : '00000000-0000-0000-0000-000000000000',
            mealType: sub.mealTypesIncluded[0],
            scheduledDate: skipDateObj,
            status: OrderStatus.SKIPPED,
            amount: new Prisma.Decimal(0)
          }
        });
      } else {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.SKIPPED }
        });
      }

      // Rule 3: Skip credit capping formula (reads from DEFAULT_SKIP_CREDIT_CAP_PERCENT env var, default 25%)
      const envCap = process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT ? parseFloat(process.env.DEFAULT_SKIP_CREDIT_CAP_PERCENT) : 25;
      const capPercent = (isNaN(envCap) || envCap < 0) ? 0.25 : envCap / 100;
      const maxSkipCredits = Math.floor(sub.totalMealsAllotted * capPercent);
      const creditBanked = sub.skipCreditsRemaining < maxSkipCredits;

      const updatedSub = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          mealsSkipped: { increment: 1 },
          ...(creditBanked && { skipCreditsRemaining: { increment: 1 } })
        }
      });

      return {
        orderId: order.id,
        orderStatus: OrderStatus.SKIPPED,
        skipCreditsRemaining: updatedSub.skipCreditsRemaining,
        creditBanked
      };
    }, { maxWait: 30000, timeout: 60000 });
  }

  async redeemSkipCredit(customerId: string, subscriptionId: string, dto: RedeemSkipCreditDto) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: customerId }
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
        message: 'Subscription not active.'
      });
    }

    if (sub.skipCreditsRemaining <= 0) {
      throw new UnprocessableEntityException({
        code: ErrorCode.NO_SKIP_CREDITS,
        message: 'No skip credits remaining to redeem.'
      });
    }

    const dateObj = new Date(dto.date);

    return this.prisma.$transaction(async (tx) => {
      // Lock target daily menu row and verify capacity / cutoff
      const dailyMenus: any[] = await tx.$queryRaw`
        SELECT id, capacity, "ordersPlaced", "cutoffTime"
        FROM "DailyMenu"
        WHERE "messId" = ${sub.messId}
          AND date = ${dateObj}
          AND "mealType"::text = ${dto.mealType}
        FOR UPDATE;
      `;

      if (dailyMenus.length === 0) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: `No daily menu available for ${dto.date} (${dto.mealType}).`
        });
      }

      const dm = dailyMenus[0];
      if (new Date() > new Date(dm.cutoffTime)) {
        throw new UnprocessableEntityException({
          code: ErrorCode.CUTOFF_PASSED,
          message: `Cutoff passed for redeeming slot on ${dto.date}.`
        });
      }

      if (dm.ordersPlaced >= dm.capacity) {
        throw new ConflictException({
          code: ErrorCode.CAPACITY_EXCEEDED,
          message: 'Meal slot capacity is fully booked.'
        });
      }

      // Decrement skip credit
      await tx.subscription.update({
        where: { id: sub.id },
        data: { skipCreditsRemaining: { decrement: 1 } }
      });

      // Increment ordersPlaced
      await tx.$executeRaw`
        UPDATE "DailyMenu" SET "ordersPlaced" = "ordersPlaced" + 1 WHERE id = ${dm.id};
      `;

      // Get user address
      const addr = await tx.address.findFirst({ where: { userId: customerId, isDefault: true } })
        || await tx.address.findFirst({ where: { userId: customerId } });

      // Create new subscription meal order
      const newOrder = await tx.order.create({
        data: {
          orderType: OrderType.SUBSCRIPTION_MEAL,
          userId: customerId,
          messId: sub.messId,
          subscriptionId: sub.id,
          addressId: addr ? addr.id : '00000000-0000-0000-0000-000000000000',
          mealType: dto.mealType,
          scheduledDate: dateObj,
          status: OrderStatus.PLACED,
          amount: new Prisma.Decimal(0)
        }
      });

      return {
        orderId: newOrder.id,
        scheduledDate: dto.date,
        mealType: dto.mealType,
        skipCreditsRemaining: sub.skipCreditsRemaining - 1
      };
    });
  }

  async pauseSubscription(customerId: string, subscriptionId: string, dto: PauseSubscriptionDto) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: customerId },
      include: { pauses: true }
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
        message: 'Active subscription required to pause.'
      });
    }

    const pauseStart = new Date(dto.pauseStart);
    const pauseEnd = new Date(dto.pauseEnd);

    if (pauseEnd < pauseStart) {
      throw new UnprocessableEntityException({
        code: ErrorCode.INVALID_PAUSE_DATES,
        message: 'pauseEnd date must be on or after pauseStart date.'
      });
    }

    // Overlapping check against existing pauses
    for (const p of sub.pauses) {
      if (pauseStart <= p.pauseEnd && pauseEnd >= p.pauseStart) {
        throw new UnprocessableEntityException({
          code: ErrorCode.OVERLAPPING_PAUSE,
          message: 'The requested pause period overlaps an existing pause.'
        });
      }
    }

    // Inclusive date arithmetic: pauseDays = (pauseEnd - pauseStart) in days + 1
    const msPerDay = 1000 * 60 * 60 * 24;
    const pauseDays = Math.round((pauseEnd.getTime() - pauseStart.getTime()) / msPerDay) + 1;

    // Extend endDate by exactly pauseDays
    const newEndDate = new Date(sub.endDate);
    newEndDate.setDate(newEndDate.getDate() + pauseDays);

    return this.prisma.$transaction(async (tx) => {
      const pauseRecord = await tx.subscriptionPause.create({
        data: {
          subscriptionId: sub.id,
          pauseStart,
          pauseEnd,
          reason: dto.reason || null
        }
      });

      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          endDate: newEndDate,
          status: SubscriptionStatus.PAUSED
        }
      });

      return {
        subscriptionPauseId: pauseRecord.id,
        newEndDate: newEndDate.toISOString().split('T')[0]
      };
    });
  }

  async cancelSubscription(customerId: string, subscriptionId: string, dto: CancelSubscriptionDto) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: customerId },
      include: { plan: true }
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new UnprocessableEntityException({
        code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
        message: 'Subscription is not currently active.'
      });
    }

    // Business Logic Rule 5: Cancellation & Pro-Rated Refund Math
    // perMealValue = plan.price / totalMealsAllotted
    // unusedMeals = totalMealsAllotted - mealsDelivered - mealsSkipped
    // grossRefund = perMealValue * unusedMeals
    // cancellationDeduction = grossRefund * (feePercent / 100)
    // netRefund = round(grossRefund - deduction, 2), clamped to >= 0
    const planPrice = new Decimal(sub.plan.price.toString());
    const perMealValue = planPrice.div(sub.totalMealsAllotted);
    const unusedMeals = sub.totalMealsAllotted - sub.mealsDelivered - sub.mealsSkipped;
    const grossRefund = perMealValue.mul(Math.max(0, unusedMeals));

    // Assume 10% fee if cancellation policy mentions fee or default 0%
    const feePercent = sub.plan.refundPolicyText.includes('10%') ? 10 : 0;
    const deduction = grossRefund.mul(feePercent / 100);
    const netRefund = Decimal.max(0, grossRefund.minus(deduction)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.CANCELLED,
          skipCreditsRemaining: 0 // Banked skip credits forfeited on cancellation (Rule 5)
        }
      });

      // Append-only refund payment row (Invariant I4)
      const refundPayment = await tx.payment.create({
        data: {
          userId: customerId,
          subscriptionId: sub.id,
          amount: new Prisma.Decimal(netRefund.toFixed(2)),
          currency: 'INR',
          type: PaymentType.REFUND,
          status: PaymentStatus.SUCCESS,
          razorpayPaymentId: `rfnd_sub_${sub.id.slice(0, 10)}`
        }
      });

      return {
        status: SubscriptionStatus.CANCELLED,
        netRefundAmount: netRefund.toFixed(2),
        refundPaymentId: refundPayment.id
      };
    });
  }

  async switchMess(customerId: string, subscriptionId: string, dto: SwitchMessDto) {
    // Business Logic Rule 11: Mid-Cycle Mess Switch (Portability)
    // 1. Cancel old subscription using Rule 5 formula
    // 2. Credit netRefund to Wallet (never direct bank refund)
    // 3. Purchase new subscription applying that wallet credit
    return this.prisma.$transaction(async (tx) => {
      const oldSub = await tx.subscription.findFirst({
        where: { id: subscriptionId, userId: customerId },
        include: { plan: true }
      });

      if (!oldSub || oldSub.status !== SubscriptionStatus.ACTIVE) {
        throw new UnprocessableEntityException({
          code: ErrorCode.SUBSCRIPTION_NOT_ACTIVE,
          message: 'Old subscription must be active to switch mess.'
        });
      }

      // Compute pro-rated refund (Rule 5)
      const planPrice = new Decimal(oldSub.plan.price.toString());
      const perMealValue = planPrice.div(oldSub.totalMealsAllotted);
      const unusedMeals = oldSub.totalMealsAllotted - oldSub.mealsDelivered - oldSub.mealsSkipped;
      const grossRefund = perMealValue.mul(Math.max(0, unusedMeals));
      const netRefund = grossRefund.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      // Cancel old subscription
      await tx.subscription.update({
        where: { id: oldSub.id },
        data: { status: SubscriptionStatus.CANCELLED, skipCreditsRemaining: 0 }
      });

      // Credit to user's wallet
      const wallet = await tx.wallet.findUnique({ where: { userId: customerId } });
      if (!wallet) throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'User wallet not found.' });

      const newBalance = new Decimal(wallet.balance.toString()).plus(netRefund);
      await tx.wallet.update({
        where: { userId: customerId },
        data: { balance: new Prisma.Decimal(newBalance.toFixed(2)) }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(netRefund.toFixed(2)),
          type: WalletTxnType.CREDIT,
          reason: `Portability credit from switching subscription ${oldSub.id}`
        }
      });

      // Find user address
      const addr = await tx.address.findFirst({ where: { userId: customerId, isDefault: true } })
        || await tx.address.findFirst({ where: { userId: customerId } });

      // Create new subscription in the same transaction
      const newPlan = await tx.subscriptionPlan.findFirst({
        where: { id: dto.newPlanId, messId: dto.newMessId, isActive: true }
      });

      if (!newPlan) {
        throw new NotFoundException({ code: ErrorCode.PLAN_NOT_FOUND, message: 'New plan not found.' });
      }

      const newMealsAllotted = newPlan.durationDays * newPlan.mealTypes.length;
      const newStartDate = new Date(dto.startDate);
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + newPlan.durationDays);

      const newPlanPrice = new Decimal(newPlan.price.toString());
      const appliedCredit = Decimal.min(netRefund, newPlanPrice);
      const remainingBalance = newPlanPrice.minus(appliedCredit);

      const newSubscription = await tx.subscription.create({
        data: {
          userId: customerId,
          messId: dto.newMessId,
          planId: dto.newPlanId,
          startDate: newStartDate,
          endDate: newEndDate,
          status: SubscriptionStatus.ACTIVE,
          mealTypesIncluded: newPlan.mealTypes,
          totalMealsAllotted: newMealsAllotted,
          mealsDelivered: 0,
          mealsSkipped: 0,
          skipCreditsRemaining: 0,
          balanceAmount: new Prisma.Decimal(remainingBalance.toFixed(2)),
          autoRenew: false
        }
      });

      return {
        oldSubscription: {
          id: oldSub.id,
          status: SubscriptionStatus.CANCELLED
        },
        walletCreditApplied: appliedCredit.toFixed(2),
        newSubscription: {
          ...newSubscription,
          balanceAmount: newSubscription.balanceAmount.toString(),
          startDate: newSubscription.startDate.toISOString().split('T')[0],
          endDate: newSubscription.endDate.toISOString().split('T')[0]
        }
      };
    });
  }
}
