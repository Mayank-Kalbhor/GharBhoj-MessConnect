import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MessModule } from './modules/mess/mess.module';
import { VendorMessModule } from './modules/vendor-mess/vendor-mess.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env']
    }),
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    MessModule,
    VendorMessModule,
    OrdersModule,
    SubscriptionsModule,
    PaymentsModule,
    WalletModule,
    ReviewsModule,
    DeliveryModule,
    PayoutsModule,
    AdminModule,
    NotificationsModule,
    JobsModule
  ]
})
export class AppModule {}
