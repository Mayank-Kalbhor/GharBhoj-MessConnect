import { ConflictException } from '@nestjs/common';
import { OrdersService } from '../../src/modules/orders/orders.service';
import { MealType } from '@messconnect/shared-types';

describe('Order Placement Concurrency (Rule 6 Race Condition)', () => {
  it('should allow only one order when capacity - ordersPlaced = 1 under concurrent requests', async () => {
    // Mock DailyMenu with capacity 10 and ordersPlaced 9 (1 slot remaining)
    let currentOrdersPlaced = 9;
    const capacity = 10;
    const cutoffTime = new Date(Date.now() + 3600000); // 1 hour in future

    // Simulate PostgreSQL row-level lock (SELECT ... FOR UPDATE) queue
    let lockQueue = Promise.resolve();

    const mockPrisma = {
      menuItem: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'item_1', price: '120.00', isAvailable: true }
        ])
      },
      $transaction: async (cb: any) => {
        // Transactions serialize on the row lock
        const prev = lockQueue;
        let release: () => void;
        lockQueue = new Promise((resolve) => { release = resolve; });

        await prev;
        try {
          const tx = {
            $queryRaw: async () => {
              return [{
                id: 'dm_1',
                capacity,
                ordersPlaced: currentOrdersPlaced,
                cutoffTime
              }];
            },
            $executeRaw: async () => {
              currentOrdersPlaced++;
              return 1;
            },
            order: {
              create: jest.fn().mockImplementation(async (args) => ({
                id: `order_${Math.random().toString(36).slice(2, 7)}`,
                status: 'PLACED',
                amount: args.data.amount
              }))
            },
            payment: {
              create: jest.fn().mockResolvedValue({ id: 'pay_1', status: 'PENDING' })
            }
          };
          return await cb(tx);
        } finally {
          release!();
        }
      }
    };

    const mockRazorpay = {
      createOrder: jest.fn().mockResolvedValue({ id: 'rzp_order_1', amount: 12000, currency: 'INR' })
    };

    const ordersService = new OrdersService(mockPrisma as any, mockRazorpay as any);

    const orderDto = {
      messId: 'mess_1',
      addressId: 'addr_1',
      mealType: MealType.LUNCH,
      scheduledDate: '2026-09-16',
      items: [{ menuItemId: 'item_1', quantity: 1 }],
      paymentMethod: 'UPI'
    };

    // Dispatch two concurrent order placements
    const results = await Promise.allSettled([
      ordersService.createOrder('cust_1', orderDto),
      ordersService.createOrder('cust_2', orderDto)
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly one must succeed and one must be rejected with 409 ConflictException
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rejectionReason: any = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason).toBeInstanceOf(ConflictException);
    expect(rejectionReason.getResponse().code).toBe('CAPACITY_EXCEEDED');
    expect(currentOrdersPlaced).toBe(10);
  });
});
