import { PayoutsService } from '../../src/modules/payouts/payouts.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RazorpayService } from '../../src/integrations/razorpay/razorpay.service';
import { Prisma } from '@prisma/client';
import { PaymentStatus, PaymentType, PayoutStatus } from '@messconnect/shared-types';

describe('PayoutsService - Production CityConfig & Payout Execution (Rule 9: Indore, 14%)', () => {
  const originalEnv = process.env;
  let payoutsService: PayoutsService;
  let mockPrisma: any;
  let mockRazorpay: any;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_COMMISSION_PERCENTAGE: '14.00', LAUNCH_CITY_NAME: 'Indore' };

    mockRazorpay = {
      createPayout: jest.fn().mockResolvedValue({
        id: 'pout_rzp_mock123',
        status: 'processed'
      })
    };

    mockPrisma = {
      mess: {
        findMany: jest.fn()
      },
      cityConfig: {
        findFirst: jest.fn()
      },
      payment: {
        findMany: jest.fn()
      },
      payout: {
        create: jest.fn().mockImplementation((args: any) => ({
          id: 'payout-123',
          ...args.data
        }))
      }
    };

    payoutsService = new PayoutsService(
      mockPrisma as unknown as PrismaService,
      mockRazorpay as unknown as RazorpayService
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('Production path: calculates payout for Indore mess using seeded CityConfig row (14.00%)', async () => {
    const mockMess = {
      id: 'mess-indore-1',
      name: 'Indore Swad Tiffin',
      city: 'Indore',
      bankAccountNumber: '987654321012',
      bankIfscCode: 'HDFC0001234'
    };

    mockPrisma.mess.findMany.mockResolvedValue([mockMess]);

    // Seeded CityConfig row in database for launch city (Indore)
    const seededCityConfig = {
      id: 'city-cfg-indore',
      cityName: 'Indore',
      commissionPercentage: new Prisma.Decimal('14.00'),
      isActive: true
    };
    mockPrisma.cityConfig.findFirst.mockResolvedValue(seededCityConfig);

    // Payments in settlement period: ₹1,00,000 gross
    mockPrisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: new Prisma.Decimal('60000.00'),
        type: PaymentType.SUBSCRIPTION_PAYMENT,
        status: PaymentStatus.SUCCESS
      },
      {
        id: 'pay-2',
        amount: new Prisma.Decimal('40000.00'),
        type: PaymentType.ORDER_PAYMENT,
        status: PaymentStatus.SUCCESS
      }
    ]);

    const results = await payoutsService.runPayoutBatch({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07'
    });

    // 1. Verify cityConfig.findFirst was queried with case-insensitive cityName and isActive: true
    expect(mockPrisma.cityConfig.findFirst).toHaveBeenCalledWith({
      where: {
        cityName: { equals: 'Indore', mode: 'insensitive' },
        isActive: true
      }
    });

    // 2. Verify commission math: 14% of ₹1,00,000 = ₹14,000.00; Net = ₹86,000.00
    expect(results.payouts.length).toBe(1);
    expect(results.payouts[0].grossAmount).toBe('100000.00');
    expect(results.payouts[0].commissionAmount).toBe('14000.00');
    expect(results.payouts[0].netAmount).toBe('86000.00');

    // 3. Verify Razorpay payout was triggered with netAmount in paise: 86000 * 100 = 8600000
    expect(mockRazorpay.createPayout).toHaveBeenCalledWith({
      accountNumber: '987654321012',
      ifsc: 'HDFC0001234',
      amountInPaise: 8600000,
      purpose: 'Settlement for 2026-09-01 to 2026-09-07'
    });

    // 4. Verify Payout record created with PROCESSED status
    expect(mockPrisma.payout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          messId: 'mess-indore-1',
          grossAmount: new Prisma.Decimal('100000.00'),
          commissionAmount: new Prisma.Decimal('14000.00'),
          netAmount: new Prisma.Decimal('86000.00'),
          status: PayoutStatus.PROCESSED,
          razorpayPayoutId: 'pout_rzp_mock123'
        })
      })
    );
  });

  it('Precedence verification: CityConfig row in database (14.00%) takes precedence over DEFAULT_COMMISSION_PERCENTAGE env var', async () => {
    // Set env var to different value (e.g. 20.00)
    process.env.DEFAULT_COMMISSION_PERCENTAGE = '20.00';

    const mockMess = {
      id: 'mess-indore-1',
      name: 'Indore Swad Tiffin',
      city: 'Indore',
      bankAccountNumber: '987654321012',
      bankIfscCode: 'HDFC0001234'
    };
    mockPrisma.mess.findMany.mockResolvedValue([mockMess]);

    // Database CityConfig row has locked-in 14.00% rate
    mockPrisma.cityConfig.findFirst.mockResolvedValue({
      id: 'city-cfg-indore',
      cityName: 'Indore',
      commissionPercentage: new Prisma.Decimal('14.00'),
      isActive: true
    });

    mockPrisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: new Prisma.Decimal('100000.00'),
        type: PaymentType.SUBSCRIPTION_PAYMENT,
        status: PaymentStatus.SUCCESS
      }
    ]);

    const results = await payoutsService.runPayoutBatch({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07'
    });

    // Payout MUST use 14.00% (database row), NOT 20.00% (env var)
    expect(results.payouts[0].commissionAmount).toBe('14000.00');
    expect(results.payouts[0].netAmount).toBe('86000.00');
    expect(mockRazorpay.createPayout).toHaveBeenCalledWith(
      expect.objectContaining({ amountInPaise: 8600000 })
    );
  });

  it('Fallback path: falls back to DEFAULT_COMMISSION_PERCENTAGE when no active CityConfig row exists', async () => {
    process.env.DEFAULT_COMMISSION_PERCENTAGE = '14.00';

    const mockMess = {
      id: 'mess-remote-1',
      name: 'Remote Mess',
      city: 'RemoteTown',
      bankAccountNumber: '112233445566',
      bankIfscCode: 'SBIN0001122'
    };
    mockPrisma.mess.findMany.mockResolvedValue([mockMess]);

    // No CityConfig in database for RemoteTown
    mockPrisma.cityConfig.findFirst.mockResolvedValue(null);

    mockPrisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: new Prisma.Decimal('50000.00'),
        type: PaymentType.SUBSCRIPTION_PAYMENT,
        status: PaymentStatus.SUCCESS
      }
    ]);

    const results = await payoutsService.runPayoutBatch({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07'
    });

    // 14% fallback of ₹50,000 = ₹7,000 commission, ₹43,000 net
    expect(results.payouts[0].commissionAmount).toBe('7000.00');
    expect(results.payouts[0].netAmount).toBe('43000.00');
  });

  it('Refund netting: nets out refunds issued in the same settlement period (Rule 9 edge case: Indore, 14%)', async () => {
    const mockMess = {
      id: 'mess-indore-1',
      name: 'Indore Swad Tiffin',
      city: 'Indore',
      bankAccountNumber: '987654321012',
      bankIfscCode: 'HDFC0001234'
    };
    mockPrisma.mess.findMany.mockResolvedValue([mockMess]);

    mockPrisma.cityConfig.findFirst.mockResolvedValue({
      id: 'city-cfg-indore',
      cityName: 'Indore',
      commissionPercentage: new Prisma.Decimal('14.00'),
      isActive: true
    });

    // Completed orders ₹50,000 + ₹10,000 refund issued in same period
    mockPrisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        amount: new Prisma.Decimal('50000.00'),
        type: PaymentType.SUBSCRIPTION_PAYMENT,
        status: PaymentStatus.SUCCESS
      },
      {
        id: 'rfnd-1',
        amount: new Prisma.Decimal('10000.00'),
        type: PaymentType.REFUND,
        status: PaymentStatus.SUCCESS
      }
    ]);

    const results = await payoutsService.runPayoutBatch({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07'
    });

    // Net gross = 50,000 - 10,000 = 40,000
    // Commission = 14% of 40,000 = 5,600.00; Net = 34,400.00
    expect(results.payouts[0].grossAmount).toBe('40000.00');
    expect(results.payouts[0].commissionAmount).toBe('5600.00');
    expect(results.payouts[0].netAmount).toBe('34400.00');
    expect(mockRazorpay.createPayout).toHaveBeenCalledWith(
      expect.objectContaining({ amountInPaise: 3440000 })
    );
  });
});
