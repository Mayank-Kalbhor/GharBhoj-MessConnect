import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { SubscriptionsController } from '../../src/modules/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../../src/modules/subscriptions/subscriptions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { RazorpayService } from '../../src/integrations/razorpay/razorpay.service';
import { UserRole, MealType, MessStatus, SubscriptionStatus } from '@messconnect/shared-types';
import { Prisma } from '@prisma/client';

describe('Live HTTP Wire + Database Integration — Skip Meal Flow (Real Supabase PostgreSQL Engine)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let serverUrl: string;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let validCustomerToken: string;

  let testVendorId: string;
  let testCustomerId: string;
  let testMessId: string;
  let testPlanId: string;
  let testAddressId: string;
  let testSubscriptionId: string;

  beforeAll(async () => {
    // 1. Initialize genuine unmocked PrismaService against live Supabase instance
    const passwordEncoded = encodeURIComponent('J-GGApS3!5_+bB@');
    const dbUrl = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/^"|"$/g, '')
      : `postgresql://postgres.npyicfvqqkpvgnardfif:${passwordEncoded}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?connect_timeout=30&pool_timeout=30`;

    prisma = new PrismaService({
      datasources: {
        db: { url: dbUrl }
      }
    } as any);
    await prisma.$connect();

    // 2. Clean up any previous test records
    await prisma.order.deleteMany({
      where: { user: { phone: { startsWith: '+9199999777' } } }
    });
    await prisma.subscription.deleteMany({
      where: { user: { phone: { startsWith: '+9199999777' } } }
    });
    await prisma.subscriptionPlan.deleteMany({
      where: { mess: { name: { startsWith: 'TEST_LIVE_SKIP_' } } }
    });
    await prisma.address.deleteMany({
      where: { user: { phone: { startsWith: '+9199999777' } } }
    });
    await prisma.mess.deleteMany({
      where: { name: { startsWith: 'TEST_LIVE_SKIP_' } }
    });
    await prisma.user.deleteMany({
      where: { phone: { startsWith: '+9199999777' } }
    });

    // 3. Create real Vendor User and Mess in Supabase
    const vendor = await prisma.user.create({
      data: {
        phone: '+91999997771',
        fullName: 'TEST_LIVE_SKIP_Vendor',
        role: UserRole.VENDOR,
        firebaseUid: 'mock_skip_vendor_uid'
      }
    });
    testVendorId = vendor.id;

    const mess = await prisma.mess.create({
      data: {
        ownerId: vendor.id,
        name: 'TEST_LIVE_SKIP_Mess',
        fssaiLicenseNumber: 'FSSAI_SKIP_LIVE_001',
        city: 'Indore',
        addressLine: 'Bhawarkua Square, Indore',
        latitude: 22.6886,
        longitude: 75.8676,
        status: MessStatus.ACTIVE,
        isVeg: true,
        cuisineTypes: ['North Indian', 'Malwi']
      }
    });
    testMessId = mess.id;

    // 4. Create real SubscriptionPlan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        messId: mess.id,
        name: 'Standard Monthly Thali',
        mealTypes: [MealType.LUNCH],
        durationDays: 30,
        price: new Prisma.Decimal('3000.00'),
        refundPolicyText: 'Standard refund policy',
        isActive: true
      }
    });
    testPlanId = plan.id;

    // 5. Create real Customer User & Address in Supabase
    const customer = await prisma.user.create({
      data: {
        phone: '+91999997772',
        fullName: 'TEST_LIVE_SKIP_Customer',
        role: UserRole.CUSTOMER,
        firebaseUid: 'mock_skip_customer_uid'
      }
    });
    testCustomerId = customer.id;

    const address = await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Hostel',
        addressLine: 'Hostel No. 4, Room 202',
        city: 'Indore',
        state: 'MP',
        pincode: '452001',
        latitude: 22.6890,
        longitude: 75.8670,
        isDefault: true
      }
    });
    testAddressId = address.id;

    // 6. Create real Subscription in Supabase with initial state:
    // mealsSkipped = 2, skipCreditsRemaining = 2
    const subscription = await prisma.subscription.create({
      data: {
        userId: customer.id,
        messId: mess.id,
        planId: plan.id,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-30'),
        status: SubscriptionStatus.ACTIVE,
        mealTypesIncluded: [MealType.LUNCH],
        totalMealsAllotted: 30,
        mealsDelivered: 12,
        mealsSkipped: 2,
        skipCreditsRemaining: 2,
        balanceAmount: new Prisma.Decimal('1800.00'),
        autoRenew: false
      }
    });
    testSubscriptionId = subscription.id;

    // 7. Initialize real NestJS application with genuine PrismaService
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-key-live-wire-jwt',
          signOptions: { expiresIn: '1h' }
        })
      ],
      controllers: [SubscriptionsController],
      providers: [
        SubscriptionsService,
        JwtAuthGuard,
        RolesGuard,
        { provide: PrismaService, useValue: prisma },
        {
          provide: RazorpayService,
          useValue: {
            createOrder: jest.fn().mockResolvedValue({ id: 'rzp_mock', amount: 0, currency: 'INR' })
          }
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // Start real HTTP listener on an ephemeral OS TCP port
    await app.listen(0);
    serverUrl = await app.getUrl();

    jwtService = moduleRef.get<JwtService>(JwtService);
    validCustomerToken = await jwtService.signAsync({
      userId: customer.id,
      role: UserRole.CUSTOMER,
      phone: customer.phone
    });
  }, 35000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.order.deleteMany({
        where: { user: { phone: { startsWith: '+9199999777' } } }
      });
      await prisma.subscription.deleteMany({
        where: { user: { phone: { startsWith: '+9199999777' } } }
      });
      await prisma.subscriptionPlan.deleteMany({
        where: { mess: { name: { startsWith: 'TEST_LIVE_SKIP_' } } }
      });
      await prisma.address.deleteMany({
        where: { user: { phone: { startsWith: '+9199999777' } } }
      });
      await prisma.mess.deleteMany({
        where: { name: { startsWith: 'TEST_LIVE_SKIP_' } }
      });
      await prisma.user.deleteMany({
        where: { phone: { startsWith: '+9199999777' } }
      });
      await prisma.$disconnect();
    }
  }, 35000);

  it('should process a real HTTP request over TCP socket, mutate physical Supabase row, and return live JSON response', async () => {
    const endpoint = `${serverUrl}/v1/subscriptions/${testSubscriptionId}/skip`;

    // 1. Client performs real HTTP POST over TCP socket
    const httpResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validCustomerToken}`
      },
      body: JSON.stringify({
        date: '2026-09-25'
      })
    });

    // 2. Validate HTTP wire transport
    expect(httpResponse.status).toBe(201);
    expect(httpResponse.headers.get('content-type')).toContain('application/json');

    const responseBody: any = await httpResponse.json();

    // 3. Verify server response contract
    expect(responseBody.orderStatus).toBe('SKIPPED');
    expect(responseBody.skipCreditsRemaining).toBe(3); // Incremented from 2 to 3
    expect(responseBody.creditBanked).toBe(true);
    expect(responseBody.orderId).toBeDefined();

    // 4. CRUCIAL UNMOCKED VERIFICATION: Direct query against physical Supabase database row
    const dbSubscription = await prisma.subscription.findUnique({
      where: { id: testSubscriptionId }
    });

    expect(dbSubscription).not.toBeNull();
    // Verify physical database columns were actually updated in PostgreSQL
    expect(dbSubscription!.mealsSkipped).toBe(3);
    expect(dbSubscription!.skipCreditsRemaining).toBe(3);

    // 5. Verify physical Order row created in PostgreSQL
    const dbOrder = await prisma.order.findFirst({
      where: {
        subscriptionId: testSubscriptionId,
        scheduledDate: new Date('2026-09-25')
      }
    });

    expect(dbOrder).not.toBeNull();
    expect(dbOrder!.id).toBe(responseBody.orderId);
    expect(dbOrder!.status).toBe('SKIPPED');
    expect(dbOrder!.orderType).toBe('SUBSCRIPTION_MEAL');
    expect(dbOrder!.userId).toBe(testCustomerId);
    expect(dbOrder!.messId).toBe(testMessId);

    // 6. Validate derived UI state math per Rule 1 driven by real database values
    const derivedRemaining = dbSubscription!.totalMealsAllotted - dbSubscription!.mealsDelivered - dbSubscription!.mealsSkipped;
    expect(derivedRemaining).toBe(30 - 12 - 3); // 15
  });

  it('should reject unauthenticated requests over the wire with HTTP 401', async () => {
    const endpoint = `${serverUrl}/v1/subscriptions/${testSubscriptionId}/skip`;

    const unauthResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-09-25' })
    });

    expect(unauthResponse.status).toBe(401);
  });
});
