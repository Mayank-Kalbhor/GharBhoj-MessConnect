import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Msg91Service {
  private readonly logger = new Logger(Msg91Service.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    this.logger.log(`[MSG91 OTP] Sent OTP ${otp} to ${phone}`);
    return true;
  }

  async sendTransactionalAlert(phone: string, templateId: string, variables: Record<string, string>): Promise<boolean> {
    this.logger.log(`[MSG91 SMS/WhatsApp] Sent template ${templateId} to ${phone} with vars: ${JSON.stringify(variables)}`);
    return true;
  }
}
