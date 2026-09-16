import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../../integrations/razorpay/razorpay.service';
import { PaymentFilterQueryDto } from './dto/payments.dto';
import {
  PaymentStatus,
  PaymentType,
  OrderStatus,
  SubscriptionStatus,
  WalletTxnType,
  UserRole
} from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { buildPaginatedResponse } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async handleRazorpayWebhook(rawBody: string | Buffer, signature: string, payload: any) {
    // 1. Verify HMAC SHA-256 signature
    this.razorpayService.verifyWebhookSignature(rawBody, signature);

    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayPaymentId = paymentEntity?.id;
    const razorpayOrderId = paymentEntity?.order_id;

    this.logger.log(`Received Razorpay webhook event: ${event} for payment ${razorpayPaymentId}`);

    if (event === 'payment.captured' && razorpayOrderId) {
      return this.processPaymentCaptured(razorpayOrderId, razorpayPaymentId);
    } else if (event === 'payment.failed' && razorpayOrderId) {
      return this.processPaymentFailed(razorpayOrderId, razorpayPaymentId);
    }

    return { status: 'EVENT_ACKNOWLEDGED' };
  }

  private async processPaymentCaptured(razorpayOrderId: string, razorpayPaymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId }
    });

    if (!payment) {
      this.logger.warn(`No payment record found for Razorpay order ID: ${razorpayOrderId}`);
      return { status: 'PAYMENT_NOT_FOUND' };
    }

    // Atomic update inside interactive transaction
    return this.prisma.$transaction(async (tx) => {
      // Atomic status transition from PENDING -> SUCCESS
      const updatedCount: number = await tx.$executeRaw`
        UPDATE "Payment"
        SET status = 'SUCCESS'::"PaymentStatus",
            "razorpayPaymentId" = ${razorpayPaymentId},
            "updatedAt" = NOW()
        WHERE id = ${payment.id} AND status = 'PENDING'::"PaymentStatus";
      `;

      if (updatedCount === 0) {
        // Redelivery or race condition: log at warn-level with razorpayPaymentId
        this.logger.warn(
          `Duplicate/concurrent webhook delivery for Razorpay payment ${razorpayPaymentId} on payment ${payment.id}; skipping duplicate processing.`
        );
        return { status: 'ALREADY_PROCESSED' };
      }

      // Execute side-effects ONLY once for the atomic winner:
      if (payment.type === PaymentType.ORDER_PAYMENT && payment.orderId) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.ACCEPTED }
        });
      } else if (payment.type === PaymentType.SUBSCRIPTION_PAYMENT && payment.subscriptionId) {
        await tx.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: SubscriptionStatus.ACTIVE }
        });
      } else if (payment.type === PaymentType.WALLET_TOPUP) {
        const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
        if (wallet) {
          const currentBal = new Decimal(wallet.balance.toString());
          const newBal = currentBal.plus(new Decimal(payment.amount.toString()));

          await tx.wallet.update({
            where: { userId: payment.userId },
            data: { balance: new Prisma.Decimal(newBal.toFixed(2)) }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: payment.amount,
              type: WalletTxnType.CREDIT,
              reason: 'Razorpay wallet top-up confirmed',
              referenceId: razorpayPaymentId
            }
          });
        }
      }

      return { status: 'SUCCESS', paymentId: payment.id };
    });
  }

  private async processPaymentFailed(razorpayOrderId: string, razorpayPaymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId }
    });

    if (!payment) return { status: 'PAYMENT_NOT_FOUND' };

    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.FAILED,
        razorpayPaymentId
      }
    });

    return { status: 'FAILED_PROCESSED' };
  }

  async getPaymentById(userId: string, role: UserRole, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Payment record not found.' });
    }

    if (role !== UserRole.ADMIN && payment.userId !== userId) {
      throw new ForbiddenException({ code: ErrorCode.FORBIDDEN, message: 'Not authorized.' });
    }

    return {
      ...payment,
      amount: payment.amount.toString()
    };
  }

  async getPayments(userId: string, role: UserRole, query: PaymentFilterQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.startDate && query.endDate && {
        createdAt: {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate)
        }
      })
    };

    if (role !== UserRole.ADMIN) {
      where.userId = userId;
    }

    const [totalItems, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formatted = payments.map(p => ({
      ...p,
      amount: p.amount.toString()
    }));

    return buildPaginatedResponse(formatted, totalItems, page, limit);
  }
}
