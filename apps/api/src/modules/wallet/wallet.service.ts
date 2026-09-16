import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from '../../integrations/razorpay/razorpay.service';
import { TopupWalletDto } from './dto/wallet.dto';
import { PaymentType, PaymentStatus } from '@messconnect/shared-types';
import { ErrorCode } from '../../common/error-codes';
import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async getMyWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!wallet) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Wallet not found for this user.'
      });
    }

    return {
      ...wallet,
      balance: wallet.balance.toString(),
      transactions: wallet.transactions.map(t => ({
        ...t,
        amount: t.amount.toString()
      }))
    };
  }

  async initiateTopup(userId: string, dto: TopupWalletDto) {
    const amount = new Decimal(dto.amount);
    const amountInPaise = Math.round(amount.mul(100).toNumber());

    const rzpOrder = await this.razorpayService.createOrder({
      amountInPaise,
      receipt: `topup_${userId.slice(0, 8)}`
    });

    await this.prisma.payment.create({
      data: {
        userId,
        amount: new Prisma.Decimal(amount.toFixed(2)),
        currency: 'INR',
        type: PaymentType.WALLET_TOPUP,
        status: PaymentStatus.PENDING,
        razorpayOrderId: rzpOrder.id
      }
    });

    return {
      razorpayOrderId: rzpOrder.id
    };
  }
}
