import { PaymentsService } from '../../src/modules/payments/payments.service';
import { PaymentType, PaymentStatus } from '@messconnect/shared-types';

describe('Razorpay Webhook Idempotency & Concurrency', () => {
  it('should process webhook atomically and prevent double crediting under concurrent deliveries', async () => {
    let paymentStatus = 'PENDING';
    let walletCreditsCount = 0;
    let walletBalance = 0;

    const mockRazorpay = {
      verifyWebhookSignature: jest.fn().mockReturnValue(true)
    };

    const mockPrisma = {
      payment: {
        findFirst: jest.fn().mockImplementation(async () => ({
          id: 'pay_123',
          userId: 'user_1',
          type: PaymentType.WALLET_TOPUP,
          amount: '500.00',
          status: paymentStatus
        }))
      },
      $transaction: async (cb: any) => {
        const tx = {
          $executeRaw: async () => {
            // Atomic check: UPDATE ... WHERE id = 'pay_123' AND status = 'PENDING'
            if (paymentStatus === 'PENDING') {
              paymentStatus = 'SUCCESS';
              return 1; // 1 row updated
            }
            return 0; // 0 rows updated because status was no longer PENDING
          },
          wallet: {
            findUnique: jest.fn().mockResolvedValue({ id: 'w_1', balance: walletBalance.toFixed(2) }),
            update: jest.fn().mockImplementation(async () => {
              walletBalance += 500;
              walletCreditsCount++;
            })
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'tx_1' })
          }
        };
        return cb(tx);
      }
    };

    const paymentsService = new PaymentsService(mockPrisma as any, mockRazorpay as any);

    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_rzp_999',
            order_id: 'order_rzp_123'
          }
        }
      }
    };

    // Dispatch two concurrent webhook deliveries for the exact same payment
    const [result1, result2] = await Promise.all([
      paymentsService.handleRazorpayWebhook('body', 'sig', webhookPayload),
      paymentsService.handleRazorpayWebhook('body', 'sig', webhookPayload)
    ]);

    const statuses = [result1.status, result2.status];

    // Exactly one SUCCESS and one ALREADY_PROCESSED
    expect(statuses).toContain('SUCCESS');
    expect(statuses).toContain('ALREADY_PROCESSED');

    // Wallet must be credited exactly once
    expect(walletCreditsCount).toBe(1);
    expect(walletBalance).toBe(500);
    expect(paymentStatus).toBe('SUCCESS');
  });
});
