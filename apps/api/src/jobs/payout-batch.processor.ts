import { Injectable, Logger } from '@nestjs/common';
import { PayoutsService } from '../modules/payouts/payouts.service';

@Injectable()
export class PayoutBatchProcessor {
  private readonly logger = new Logger(PayoutBatchProcessor.name);

  constructor(private readonly payoutsService: PayoutsService) {}

  async runScheduledPayouts(): Promise<any> {
    const today = new Date();
    // Previous 7-day settlement period
    const end = new Date(today);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const periodStart = start.toISOString().split('T')[0];
    const periodEnd = end.toISOString().split('T')[0];

    this.logger.log(`Executing scheduled weekly payout batch for period ${periodStart} to ${periodEnd}`);
    return this.payoutsService.runPayoutBatch({
      periodStart,
      periodEnd
    });
  }
}
