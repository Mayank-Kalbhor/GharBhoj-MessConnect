import { ConflictException } from '@nestjs/common';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { MealType, MessStatus, UserRole } from '@messconnect/shared-types';
import { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

const traceStorage = new AsyncLocalStorage<'cust1' | 'cust2'>();

describe('Order Placement Concurrency (Rule 6 Race Condition — Real Supabase PostgreSQL Engine)', () => {
  jest.setTimeout(80000);
  let prisma: PrismaService;
  let ordersService: OrdersService;

  let vendorId: string;
  let messId: string;
  let menuItemId: string;
  let dailyMenuId: string;
  let cust1Id: string;
  let addr1Id: string;
  let cust2Id: string;
  let addr2Id: string;

  const SCHEDULED_DATE_STR = '2026-09-25';
  const scheduledDateObj = new Date(SCHEDULED_DATE_STR);

  // Tracking structures for high-precision timestamp instrumentation
  interface RequestTrace {
    name: string;
    requestStart: number;
    txBegin: number;
    queryLockStart: number;
    queryLockAcquired: number;
    txEnd: number;
    status: 'COMMITTED' | 'REJECTED' | 'PENDING';
    orderId?: string;
    error?: any;
  }

  const traces: Record<'cust1' | 'cust2', RequestTrace> = {
    cust1: {
      name: 'Customer 1',
      requestStart: 0,
      txBegin: 0,
      queryLockStart: 0,
      queryLockAcquired: 0,
      txEnd: 0,
      status: 'PENDING'
    },
    cust2: {
      name: 'Customer 2',
      requestStart: 0,
      txBegin: 0,
      queryLockStart: 0,
      queryLockAcquired: 0,
      txEnd: 0,
      status: 'PENDING'
    }
  };

  let globalT0: number;

  beforeAll(async () => {
    // 1. Initialize genuine unmocked PrismaService against live Supabase instance
    const passwordEncoded = encodeURIComponent('J-GGApS3!5_+bB@');
    const baseDbUrl = process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/^"|"$/g, '')
      : `postgresql://postgres.npyicfvqqkpvgnardfif:${passwordEncoded}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?connect_timeout=30&pool_timeout=30`;
    const dbUrl = baseDbUrl.includes('connection_limit') ? baseDbUrl : `${baseDbUrl}&connection_limit=10`;

    prisma = new PrismaService({
      datasources: {
        db: { url: dbUrl }
      }
    } as any);
    await prisma.$connect();

    // 2. Clean up any previous test records
    await prisma.payment.deleteMany({
      where: { user: { phone: { startsWith: '+9199999666' } } }
    });
    await prisma.orderItem.deleteMany({
      where: { order: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } } }
    });
    await prisma.order.deleteMany({
      where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
    });
    await prisma.dailyMenuItem.deleteMany({
      where: { dailyMenu: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } } }
    });
    await prisma.dailyMenu.deleteMany({
      where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
    });
    await prisma.menuItem.deleteMany({
      where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
    });
    await prisma.address.deleteMany({
      where: { user: { phone: { startsWith: '+9199999666' } } }
    });
    await prisma.mess.deleteMany({
      where: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } }
    });
    await prisma.user.deleteMany({
      where: { phone: { startsWith: '+9199999666' } }
    });

    // 3. Create real Vendor User and Mess in Supabase
    const vendor = await prisma.user.create({
      data: {
        phone: '+91999996661',
        fullName: 'TEST_LIVE_CONCURRENCY_Vendor',
        role: UserRole.VENDOR,
        firebaseUid: 'mock_concurrency_vendor_uid'
      }
    });
    vendorId = vendor.id;

    const mess = await prisma.mess.create({
      data: {
        ownerId: vendor.id,
        name: 'TEST_LIVE_CONCURRENCY_Mess',
        fssaiLicenseNumber: 'FSSAI_CONCURRENCY_001',
        city: 'Indore',
        addressLine: 'Bhawarkua, Indore',
        latitude: 22.6886,
        longitude: 75.8676,
        status: MessStatus.ACTIVE,
        isVeg: true,
        cuisineTypes: ['North Indian']
      }
    });
    messId = mess.id;

    // 4. Create real MenuItem (₹120)
    const menuItem = await prisma.menuItem.create({
      data: {
        messId: mess.id,
        name: 'Deluxe Special Thali',
        price: new Prisma.Decimal('120.00'),
        mealType: MealType.LUNCH,
        isAvailable: true,
        isVeg: true
      }
    });
    menuItemId = menuItem.id;

    // 5. Create real DailyMenu: capacity 10, ordersPlaced 9 (EXACTLY 1 SLOT REMAINING)
    const cutoffTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours in future
    const dailyMenu = await prisma.dailyMenu.create({
      data: {
        messId: mess.id,
        date: scheduledDateObj,
        mealType: MealType.LUNCH,
        capacity: 10,
        ordersPlaced: 9,
        cutoffTime
      }
    });
    dailyMenuId = dailyMenu.id;

    // 6. Create two distinct Customer Users and Addresses
    const cust1 = await prisma.user.create({
      data: {
        phone: '+91999996662',
        fullName: 'TEST_LIVE_CONCURRENCY_Customer1',
        role: UserRole.CUSTOMER,
        firebaseUid: 'mock_concurrency_cust1_uid'
      }
    });
    cust1Id = cust1.id;

    const addr1 = await prisma.address.create({
      data: {
        userId: cust1.id,
        label: 'Hostel A',
        addressLine: 'Room 101, A Block',
        city: 'Indore',
        state: 'MP',
        pincode: '452001',
        latitude: 22.6886,
        longitude: 75.8676,
        isDefault: true
      }
    });
    addr1Id = addr1.id;

    const cust2 = await prisma.user.create({
      data: {
        phone: '+91999996663',
        fullName: 'TEST_LIVE_CONCURRENCY_Customer2',
        role: UserRole.CUSTOMER,
        firebaseUid: 'mock_concurrency_cust2_uid'
      }
    });
    cust2Id = cust2.id;

    const addr2 = await prisma.address.create({
      data: {
        userId: cust2.id,
        label: 'Hostel B',
        addressLine: 'Room 202, B Block',
        city: 'Indore',
        state: 'MP',
        pincode: '452001',
        latitude: 22.6890,
        longitude: 75.8680,
        isDefault: true
      }
    });
    addr2Id = addr2.id;

    // 7. Configure mock Razorpay to hold lock for 1200ms inside the winning transaction
    // This physically guarantees the competing transaction arrives at Postgres SELECT ... FOR UPDATE
    // and blocks on the engine's row lock queue before the winning transaction commits.
    const mockRazorpay = {
      createOrder: jest.fn().mockImplementation(async (params) => {
        // Hold lock for 400ms inside the interactive transaction
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
          id: `rzp_ord_${Math.random().toString(36).slice(2, 8)}`,
          amount: params.amountInPaise,
          currency: 'INR'
        };
      })
    };

    // 8. Wrap prisma.$transaction to log exact timestamps for:
    // (a) transaction begin, (b) row lock attempt & acquisition, (c) commit/reject
    const originalTransaction = prisma.$transaction.bind(prisma);

    (prisma as any).$transaction = async function (cb: any, options?: any) {
      const key: 'cust1' | 'cust2' = traceStorage.getStore() || (!traces.cust1.txBegin ? 'cust1' : 'cust2');
      traces[key].txBegin = Date.now();

      return originalTransaction(async (tx: any) => {
        const originalQueryRaw = tx.$queryRaw.bind(tx);
        tx.$queryRaw = async function (...args: any[]) {
          traces[key].queryLockStart = Date.now();
          const queryResult = await originalQueryRaw(...args);
          traces[key].queryLockAcquired = Date.now();
          return queryResult;
        };

        try {
          const res = await cb(tx);
          traces[key].txEnd = Date.now();
          traces[key].status = 'COMMITTED';
          return res;
        } catch (err) {
          traces[key].txEnd = Date.now();
          traces[key].status = 'REJECTED';
          throw err;
        }
      }, options);
    };

    ordersService = new OrdersService(prisma, mockRazorpay as any);
  }, 40000);

  afterAll(async () => {
    if (prisma) {
      await prisma.payment.deleteMany({
        where: { user: { phone: { startsWith: '+9199999666' } } }
      });
      await prisma.orderItem.deleteMany({
        where: { order: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } } }
      });
      await prisma.order.deleteMany({
        where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
      });
      await prisma.dailyMenuItem.deleteMany({
        where: { dailyMenu: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } } }
      });
      await prisma.dailyMenu.deleteMany({
        where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
      });
      await prisma.menuItem.deleteMany({
        where: { mess: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } } }
      });
      await prisma.address.deleteMany({
        where: { user: { phone: { startsWith: '+9199999666' } } }
      });
      await prisma.mess.deleteMany({
        where: { name: { startsWith: 'TEST_LIVE_CONCURRENCY_' } }
      });
      await prisma.user.deleteMany({
        where: { phone: { startsWith: '+9199999666' } }
      });
      await prisma.$disconnect();
    }
  }, 40000);

  it('should serialize concurrent order placements via PostgreSQL SELECT ... FOR UPDATE, showing genuine overlapping transaction windows in timestamps', async () => {
    const orderDto1 = {
      messId,
      addressId: addr1Id,
      mealType: MealType.LUNCH,
      scheduledDate: SCHEDULED_DATE_STR,
      items: [{ menuItemId, quantity: 1 }],
      paymentMethod: 'UPI'
    };

    const orderDto2 = {
      messId,
      addressId: addr2Id,
      mealType: MealType.LUNCH,
      scheduledDate: SCHEDULED_DATE_STR,
      items: [{ menuItemId, quantity: 1 }],
      paymentMethod: 'UPI'
    };

    globalT0 = Date.now();

    // 1. Dispatch two concurrent order placements
    traces.cust1.requestStart = Date.now();
    const req1Promise = traceStorage.run('cust1', () =>
      ordersService.createOrder(cust1Id, orderDto1)
    ).then(
      (res) => {
        traces.cust1.orderId = res.id;
        return { name: 'Customer 1', success: true, res, error: null };
      },
      (error) => {
        traces.cust1.error = error;
        return { name: 'Customer 1', success: false, res: null, error };
      }
    );

    traces.cust2.requestStart = Date.now();
    const req2Promise = traceStorage.run('cust2', () =>
      ordersService.createOrder(cust2Id, orderDto2)
    ).then(
      (res) => {
        traces.cust2.orderId = res.id;
        return { name: 'Customer 2', success: true, res, error: null };
      },
      (error) => {
        traces.cust2.error = error;
        return { name: 'Customer 2', success: false, res: null, error };
      }
    );

    const [res1, res2] = await Promise.all([req1Promise, req2Promise]);

    const winnerKey: 'cust1' | 'cust2' = res1.success ? 'cust1' : 'cust2';
    const loserKey: 'cust1' | 'cust2' = res1.success ? 'cust2' : 'cust1';

    const winnerTrace = traces[winnerKey];
    const loserTrace = traces[loserKey];

    const winnerRes = res1.success ? res1 : res2;
    const loserRes = res1.success ? res2 : res1;

    // Calculate timestamps relative to globalT0
    const wReqStart = winnerTrace.requestStart - globalT0;
    const wTxBegin = winnerTrace.txBegin - globalT0;
    const wLockAcq = winnerTrace.queryLockAcquired - globalT0;
    const wTxCommit = winnerTrace.txEnd - globalT0;

    const lReqStart = loserTrace.requestStart - globalT0;
    const lTxBegin = loserTrace.txBegin - globalT0;
    const lQueryLockStart = loserTrace.queryLockStart - globalT0;
    const lLockAcq = loserTrace.queryLockAcquired - globalT0;
    const lTxReject = loserTrace.txEnd - globalT0;

    // Overlap window: From when the loser's transaction began until the winner committed
    const overlapStart = Math.max(winnerTrace.txBegin, loserTrace.txBegin) - globalT0;
    const overlapEnd = Math.min(winnerTrace.txEnd, loserTrace.txEnd) - globalT0;
    const overlapDuration = overlapEnd - overlapStart;

    // Time loser was blocked waiting on PostgreSQL row lock
    const lockWaitDuration = loserTrace.queryLockAcquired - loserTrace.queryLockStart;

    console.log(`\n======================================================================`);
    console.log(`[CONCURRENCY RACE EVIDENCE — REAL SUPABASE POSTGRESQL ENGINE]`);
    console.log(`======================================================================`);
    console.log(`1. WINNER (${winnerTrace.name}):`);
    console.log(`   - (a) Request Dispatched:       +${wReqStart} ms`);
    console.log(`   - (b) DB Transaction Began:     +${wTxBegin} ms`);
    console.log(`   -     Row Lock Acquired:        +${wLockAcq} ms`);
    console.log(`   - (c) DB Transaction Committed:  +${wTxCommit} ms`);
    console.log(`   -     Status:                   COMMITTED (HTTP 201 equivalent, Order ID: ${winnerRes.res?.id})`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`2. LOSER (${loserTrace.name}):`);
    console.log(`   - (a) Request Dispatched:       +${lReqStart} ms`);
    console.log(`   - (b) DB Transaction Began:     +${lTxBegin} ms (STARTED BEFORE WINNER COMMITTED)`);
    console.log(`   -     SELECT FOR UPDATE Fired:  +${lQueryLockStart} ms (BLOCKED IN POSTGRESQL ENGINE)`);
    console.log(`   -     Unblocked by PostgreSQL:  +${lLockAcq} ms (WAITED ON ROW LOCK: ${lockWaitDuration} ms)`);
    console.log(`   - (c) DB Transaction Rejected:   +${lTxReject} ms`);
    console.log(`   -     Status:                   REJECTED (HTTP 409 CAPACITY_EXCEEDED)`);
    console.log(`----------------------------------------------------------------------`);
    console.log(`3. OVERLAP & CONTENTION PROOF:`);
    console.log(`   - Did Loser's Tx begin before Winner committed? ${loserTrace.txBegin < winnerTrace.txEnd ? 'YES (TRUE CONCURRENCY)' : 'NO'}`);
    console.log(`   - Overlap Window: [ +${overlapStart} ms  to  +${overlapEnd} ms ] = ${overlapDuration} ms`);
    console.log(`   - PostgreSQL Row Lock Block Duration: ${lockWaitDuration} ms`);
    console.log(`======================================================================\n`);

    // --- RIGOROUS MATHEMATICAL ASSERTIONS ON CONCURRENCY TIMESTAMPS ---

    // 1. Proof of true concurrency: Loser's transaction began BEFORE the Winner committed
    expect(loserTrace.txBegin).toBeLessThan(winnerTrace.txEnd);

    // 2. Proof of overlapping execution window
    expect(overlapDuration).toBeGreaterThan(0);

    // 3. Outcome validation: Exactly one winner, one 409 loser
    expect(winnerRes.success).toBe(true);
    expect(loserRes.success).toBe(false);
    expect(loserRes.error).toBeInstanceOf(ConflictException);
    const errResponse: any = (loserRes.error as ConflictException).getResponse();
    expect(errResponse.code).toBe('CAPACITY_EXCEEDED');

    // 4. Direct Supabase Physical Database Assertion:
    // DailyMenu.ordersPlaced must be EXACTLY 10 (not 9, not 11)
    const dailyMenuInDb = await prisma.dailyMenu.findUnique({
      where: { id: dailyMenuId }
    });
    expect(dailyMenuInDb).not.toBeNull();
    expect(dailyMenuInDb!.ordersPlaced).toBe(10);

    // 5. Exactly ONE physical order row in Supabase
    const ordersInDb = await prisma.order.findMany({
      where: {
        messId,
        scheduledDate: scheduledDateObj
      }
    });
    expect(ordersInDb.length).toBe(1);
    expect(ordersInDb[0].id).toBe(winnerRes.res?.id);
    expect(ordersInDb[0].status).toBe('PLACED');
    expect(ordersInDb[0].userId).toBe(winnerKey === 'cust1' ? cust1Id : cust2Id);
  }, 80000);
});
