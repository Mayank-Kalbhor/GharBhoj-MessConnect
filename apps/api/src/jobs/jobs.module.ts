import { Module } from '@nestjs/common';
import { SubscriptionRenewalProcessor } from './subscription-renewal.processor';
import { DailyOrderGenerationProcessor } from './daily-order-generation.processor';
import { PayoutBatchProcessor } from './payout-batch.processor';
import { NotificationDispatchProcessor } from './notification-dispatch.processor';
import { PayoutsModule } from '../modules/payouts/payouts.module';

@Module({
  imports: [PayoutsModule],
  providers: [
    SubscriptionRenewalProcessor,
    DailyOrderGenerationProcessor,
    PayoutBatchProcessor,
    NotificationDispatchProcessor
  ],
  exports: [
    SubscriptionRenewalProcessor,
    DailyOrderGenerationProcessor,
    PayoutBatchProcessor,
    NotificationDispatchProcessor
  ]
})
export class JobsModule {}
