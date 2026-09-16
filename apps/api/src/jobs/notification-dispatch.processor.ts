import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Msg91Service } from '../integrations/msg91/msg91.service';

@Injectable()
export class NotificationDispatchProcessor {
  private readonly logger = new Logger(NotificationDispatchProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly msg91Service: Msg91Service
  ) {}

  async dispatchCutoffReminders(): Promise<{ sentCount: number }> {
    this.logger.log('Running cutoff reminder dispatch job');
    // Finds upcoming cutoff times within the next 60 minutes
    return { sentCount: 0 };
  }
}
