import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../../integrations/razorpay/razorpay.service';
import { RunPayoutsDto } from './dto/payouts.dto';
import { PaymentStatus, PaymentType, PayoutStatus } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async getVendorPayouts(ownerId: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { ownerId }
    });

    if (!mess) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Mess not found.' });
    }

    const payouts = await this.prisma.payout.findMany({
      where: { messId: mess.id },
      orderBy: { periodEnd: 'desc' }
    });

    return payouts.map(p => ({
      ...p,
      grossAmount: new Decimal(p.grossAmount.toString()).toFixed(2),
      commissionAmount: new Decimal(p.commissionAmount.toString()).toFixed(2),
      netAmount: new Decimal(p.netAmount.toString()).toFixed(2),
      periodStart: p.periodStart.toISOString().split('T')[0],
      periodEnd: p.periodEnd.toISOString().split('T')[0]
    }));
  }

  async runPayoutBatch(dto: RunPayoutsDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    // Target specific mess or all active messes
    const messes = await this.prisma.mess.findMany({
      where: {
        ...(dto.messId && { id: dto.messId }),
        bankAccountNumber: { not: null },
        bankIfscCode: { not: null }
      }
    });

    const results = [];

    for (const mess of messes) {
      // Find active CityConfig for commission
      const cityConfig = await this.prisma.cityConfig.findFirst({
        where: {
          cityName: { equals: mess.city, mode: 'insensitive' },
          isActive: true
        }
      });
      const defaultCommission = process.env.DEFAULT_COMMISSION_PERCENTAGE || '14.00';
      const commissionPercent = cityConfig
        ? new Decimal(cityConfig.commissionPercentage.toString())
        : new Decimal(defaultCommission);

      // Business Logic Rule 9:
      // grossAmount = SUM(Payment.amount) for completed Orders/Subscriptions in the period
      // net out refunds (Payment.type = REFUND) issued inside the period
      const payments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.SUCCESS,
          createdAt: { gte: periodStart, lte: periodEnd },
          OR: [
            { order: { messId: mess.id } },
            { subscription: { messId: mess.id } }
          ]
        }
      });

      let grossAmount = new Decimal(0);
      for (const p of payments) {
        const amt = new Decimal(p.amount.toString());
        if ([PaymentType.ORDER_PAYMENT, PaymentType.SUBSCRIPTION_PAYMENT].includes(p.type as PaymentType)) {
          grossAmount = grossAmount.plus(amt);
        } else if (p.type === PaymentType.REFUND) {
          grossAmount = grossAmount.minus(amt); // Net out refunds
        }
      }

      grossAmount = Decimal.max(0, grossAmount);
      const commissionAmount = grossAmount.mul(commissionPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netAmount = grossAmount.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      if (netAmount.gt(0)) {
        // Trigger Razorpay payout
        const rzpPayout = await this.razorpayService.createPayout({
          accountNumber: mess.bankAccountNumber!,
          ifsc: mess.bankIfscCode!,
          amountInPaise: Math.round(netAmount.mul(100).toNumber()),
          purpose: `Settlement for ${dto.periodStart} to ${dto.periodEnd}`
        });

        const payout = await this.prisma.payout.create({
          data: {
            messId: mess.id,
            periodStart,
            periodEnd,
            grossAmount: new Prisma.Decimal(grossAmount.toFixed(2)),
            commissionAmount: new Prisma.Decimal(commissionAmount.toFixed(2)),
            netAmount: new Prisma.Decimal(netAmount.toFixed(2)),
            status: PayoutStatus.PROCESSED,
            razorpayPayoutId: rzpPayout.id,
            processedAt: new Date()
          }
        });

        results.push({
          payoutId: payout.id,
          messId: mess.id,
          grossAmount: new Decimal(payout.grossAmount.toString()).toFixed(2),
          commissionAmount: new Decimal(payout.commissionAmount.toString()).toFixed(2),
          netAmount: new Decimal(payout.netAmount.toString()).toFixed(2),
          status: payout.status
        });
      }
    }

    return {
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      processedCount: results.length,
      payouts: results
    };
  }
}
