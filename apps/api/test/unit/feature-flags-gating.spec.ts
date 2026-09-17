import { ForbiddenException } from '@nestjs/common';
import { SubscriptionsController } from '../../src/modules/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../../src/modules/subscriptions/subscriptions.service';
import { AdminController } from '../../src/modules/admin/admin.controller';
import { AdminService } from '../../src/modules/admin/admin.service';
import { SubscriptionRenewalProcessor } from '../../src/jobs/subscription-renewal.processor';
import { MessService } from '../../src/modules/mess/mess.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RazorpayService } from '../../src/integrations/razorpay/razorpay.service';
import { ErrorCode } from '../../src/common/error-codes';
import { UserRole } from '@messconnect/shared-types';

describe('Feature Flags Gating (Step 2 Next Steps)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Feature Flag 1: ENABLE_MESS_SWITCH', () => {
    it('should throw 403 ForbiddenException with FEATURE_DISABLED when ENABLE_MESS_SWITCH is false', async () => {
      process.env.ENABLE_MESS_SWITCH = 'false';

      const mockSubscriptionsService = {
        switchMess: jest.fn()
      } as unknown as SubscriptionsService;

      const controller = new SubscriptionsController(mockSubscriptionsService);

      try {
        await controller.switchMess(
          { userId: 'user-1', phone: '9876543210', role: UserRole.CUSTOMER },
          'sub-123',
          { newMessId: 'mess-456', newPlanId: 'plan-789', startDate: '2026-10-01' }
        );
        fail('Expected ForbiddenException to be thrown');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        const response = err.getResponse();
        expect(response.code).toBe(ErrorCode.FEATURE_DISABLED);
        expect(response.message).toContain('Mess switching is currently disabled in V1');
      }

      expect(mockSubscriptionsService.switchMess).not.toHaveBeenCalled();
    });

    it('should call switchMess service when ENABLE_MESS_SWITCH is true', async () => {
      process.env.ENABLE_MESS_SWITCH = 'true';

      const mockResult: any = {
        oldSubscription: { id: 'sub-123' },
        walletCreditApplied: '850.00',
        newSubscription: { id: 'sub-456' }
      };

      const mockSubscriptionsService = {
        switchMess: jest.fn().mockResolvedValue(mockResult)
      } as unknown as SubscriptionsService;

      const controller = new SubscriptionsController(mockSubscriptionsService);

      const result = await controller.switchMess(
        { userId: 'user-1', phone: '9876543210', role: UserRole.CUSTOMER },
        'sub-123',
        { newMessId: 'mess-456', newPlanId: 'plan-789', startDate: '2026-10-01' }
      );

      expect(mockSubscriptionsService.switchMess).toHaveBeenCalledWith(
        'user-1',
        'sub-123',
        { newMessId: 'mess-456', newPlanId: 'plan-789', startDate: '2026-10-01' }
      );
      expect(result).toBeDefined();
    });
  });

  describe('Feature Flag 2: ENABLE_AUTO_RENEW', () => {
    it('should skip renewal job and return 0 renewals when ENABLE_AUTO_RENEW is false', async () => {
      process.env.ENABLE_AUTO_RENEW = 'false';

      const mockPrisma = {
        subscription: {
          findMany: jest.fn()
        }
      } as unknown as PrismaService;

      const mockRazorpay = {} as unknown as RazorpayService;

      const processor = new SubscriptionRenewalProcessor(mockPrisma, mockRazorpay);
      const result = await processor.processRenewals();

      expect(result).toEqual({ renewedCount: 0 });
      expect(mockPrisma.subscription.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Feature Flag 3: ENABLE_CITY_CONFIG_UI', () => {
    let adminController: AdminController;
    let mockAdminService: jest.Mocked<Partial<AdminService>>;

    beforeEach(() => {
      mockAdminService = {
        getCityConfigs: jest.fn(),
        createCityConfig: jest.fn(),
        updateCityConfig: jest.fn()
      };
      adminController = new AdminController(mockAdminService as unknown as AdminService);
    });

    it('GET /admin/city-configs should throw 403 FEATURE_DISABLED when ENABLE_CITY_CONFIG_UI is false', async () => {
      process.env.ENABLE_CITY_CONFIG_UI = 'false';

      try {
        await adminController.getCityConfigs();
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse().code).toBe(ErrorCode.FEATURE_DISABLED);
      }
      expect(mockAdminService.getCityConfigs).not.toHaveBeenCalled();
    });

    it('POST /admin/city-configs should throw 403 FEATURE_DISABLED when ENABLE_CITY_CONFIG_UI is false', async () => {
      process.env.ENABLE_CITY_CONFIG_UI = 'false';

      try {
        await adminController.createCityConfig({
          cityName: 'Pune',
          commissionPercentage: '12.00'
        });
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse().code).toBe(ErrorCode.FEATURE_DISABLED);
      }
      expect(mockAdminService.createCityConfig).not.toHaveBeenCalled();
    });

    it('PATCH /admin/city-configs/:id should throw 403 FEATURE_DISABLED when ENABLE_CITY_CONFIG_UI is false', async () => {
      process.env.ENABLE_CITY_CONFIG_UI = 'false';

      try {
        await adminController.updateCityConfig('config-1', {
          commissionPercentage: '15.00'
        });
        fail('Expected ForbiddenException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.getResponse().code).toBe(ErrorCode.FEATURE_DISABLED);
      }
      expect(mockAdminService.updateCityConfig).not.toHaveBeenCalled();
    });
  });
});
