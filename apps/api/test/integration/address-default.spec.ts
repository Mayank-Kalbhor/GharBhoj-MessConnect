import { UsersService } from '../../src/modules/users/users.service';

describe('Address Default Single Invariant', () => {
  it('should unset isDefault on previous addresses when a new default is created', async () => {
    const addresses: any[] = [
      { id: 'addr_1', userId: 'user_1', isDefault: true, label: 'Hostel' }
    ];

    const mockPrisma = {
      $transaction: async (cb: any) => {
        const tx = {
          address: {
            updateMany: jest.fn().mockImplementation(async (args) => {
              for (const a of addresses) {
                if (a.userId === args.where.userId) {
                  a.isDefault = false;
                }
              }
              return { count: 1 };
            }),
            create: jest.fn().mockImplementation(async (args) => {
              const newAddr = { id: 'addr_2', ...args.data };
              addresses.push(newAddr);
              return newAddr;
            })
          }
        };
        return cb(tx);
      }
    };

    const usersService = new UsersService(mockPrisma as any);

    await usersService.createAddress('user_1', {
      label: 'Home',
      addressLine: '123 Main St',
      city: 'Indore',
      state: 'MP',
      pincode: '452001',
      latitude: 22.7,
      longitude: 75.8,
      isDefault: true
    });

    const defaultAddresses = addresses.filter(a => a.isDefault);
    expect(defaultAddresses.length).toBe(1);
    expect(defaultAddresses[0].id).toBe('addr_2');
    expect(addresses.find(a => a.id === 'addr_1').isDefault).toBe(false);
  });
});
