import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../integrations/razorpay/razorpay.service';
import { SubscriptionStatus } from '@messconnect/shared-types';

@Injectable()
export class SubscriptionRenewalProcessor {
  private readonly logger = new Logger(SubscriptionRenewalProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService
  ) {}

  async processRenewals(): Promise<{ renewedCount: number }> {
    if (process.env.ENABLE_AUTO_RENEW !== 'true') {
      this.logger.log('Subscription auto-renewal is disabled in V1 via ENABLE_AUTO_RENEW=false flag.');
      return { renewedCount: 0 };
    }

    const today = new Date();
    this.logger.log(`Running daily subscription renewal processor for date: ${today.toISOString()}`);

    const expiring = await this.prisma.subscription.findMany({
      where: {
        autoRenew: true,
        status: SubscriptionStatus.ACTIVE,
        endDate: { lte: today }
      },
      include: { plan: true, user: true }
    });

    let count = 0;
    for (const sub of expiring) {
      try {
        this.logger.log(`Renewing subscription ${sub.id} for user ${sub.user.fullName}`);
        count++;
      } catch (err: any) {
        this.logger.error(`Failed to renew subscription ${sub.id}: ${err.message}`);
      }
    }

    return { renewedCount: count };
  }
}
