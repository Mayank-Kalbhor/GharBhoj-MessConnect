import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionStatus, OrderStatus, OrderType } from '@messconnect/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyOrderGenerationProcessor {
  private readonly logger = new Logger(DailyOrderGenerationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateTomorrowOrders(): Promise<{ generatedCount: number }> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
    const tomorrowDate = new Date(tomorrowDateStr);

    this.logger.log(`Generating subscription meal orders for tomorrow: ${tomorrowDateStr}`);

    const activeSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        startDate: { lte: tomorrowDate },
        endDate: { gte: tomorrowDate }
      },
      include: {
        pauses: {
          where: {
            pauseStart: { lte: tomorrowDate },
            pauseEnd: { gte: tomorrowDate }
          }
        },
        user: {
          include: { addresses: { where: { isDefault: true } } }
        }
      }
    });

    let count = 0;
    for (const sub of activeSubs) {
      // If subscription is paused on tomorrow's date, do not generate meal orders (Rule 4)
      if (sub.pauses.length > 0) {
        continue;
      }

      for (const mealType of sub.mealTypesIncluded) {
        // Check if order already exists
        const existing = await this.prisma.order.findFirst({
          where: {
            subscriptionId: sub.id,
            scheduledDate: tomorrowDate,
            mealType
          }
        });

        if (!existing) {
          const address = sub.user.addresses[0] || (await this.prisma.address.findFirst({ where: { userId: sub.userId } }));
          if (address) {
            await this.prisma.order.create({
              data: {
                orderType: OrderType.SUBSCRIPTION_MEAL,
                userId: sub.userId,
                messId: sub.messId,
                subscriptionId: sub.id,
                addressId: address.id,
                mealType,
                scheduledDate: tomorrowDate,
                status: OrderStatus.PLACED,
                amount: new Prisma.Decimal('0.00')
              }
            });
            count++;
          }
        }
      }
    }

    this.logger.log(`Generated ${count} subscription orders for tomorrow.`);
    return { generatedCount: count };
  }
}
