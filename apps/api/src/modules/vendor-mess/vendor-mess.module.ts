import { Module } from '@nestjs/common';
import { VendorMessController } from './vendor-mess.controller';
import { VendorMessService } from './vendor-mess.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VendorMessController],
  providers: [VendorMessService],
  exports: [VendorMessService]
})
export class VendorMessModule {}
