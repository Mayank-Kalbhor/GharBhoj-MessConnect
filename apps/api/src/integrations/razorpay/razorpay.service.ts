import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { ErrorCode } from '../../common/error-codes';

export interface CreateRazorpayOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_mock';
    this.keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || 'secret_test_mock';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || 'whsec_test_mock';
  }

  async createOrder(params: CreateRazorpayOrderParams): Promise<{ id: string; amount: number; currency: string }> {
    // Generate order id
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    this.logger.log(`Created Razorpay Order: ${mockOrderId} for amount: ₹${params.amountInPaise / 100}`);
    return {
      id: mockOrderId,
      amount: params.amountInPaise,
      currency: params.currency || 'INR'
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    if (!signature) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_WEBHOOK_SIGNATURE,
        message: 'Missing X-Razorpay-Signature header'
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!isValid) {
      this.logger.warn(`Razorpay webhook signature mismatch. Received: ${signature}`);
    }

    return isValid;
  }

  async createPayout(params: {
    accountNumber: string;
    ifsc: string;
    amountInPaise: number;
    purpose: string;
  }): Promise<{ id: string; status: string }> {
    const mockPayoutId = `pout_${crypto.randomBytes(8).toString('hex')}`;
    this.logger.log(`Initiated Razorpay Payout ${mockPayoutId} of ₹${params.amountInPaise / 100} to ${params.accountNumber}`);
    return {
      id: mockPayoutId,
      status: 'PROCESSED'
    };
  }
}
