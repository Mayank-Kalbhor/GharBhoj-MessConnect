import { MessService } from '../../src/modules/mess/mess.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('MessService - Strict PostGIS Spatial Discovery (No Diverging Approximations)', () => {
  let messService: MessService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
      mess: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn()
      },
      dailyMenu: {
        findMany: jest.fn()
      }
    };

    messService = new MessService(mockPrisma as unknown as PrismaService);
  });

  describe('Strict PostGIS Query Execution', () => {
    it('should execute parameterized PostGIS $queryRaw when lat/lng are provided', async () => {
      // User location: Indore (22.7196, 75.8577)
      const userLat = 22.7196;
      const userLng = 75.8577;

      const mockPostGisResults = [
        {
          id: 'mess-1',
          name: 'Indore Annapurna Mess',
          avgRating: 4.8,
          consistencyScore: 92,
          isVeg: true,
          cuisineTypes: ['North Indian'],
          city: 'Indore',
          status: 'ACTIVE',
          distanceMeters: 450
        }
      ];

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockPostGisResults) // for data query
        .mockResolvedValueOnce([{ count: 1 }]);   // for count query

      const result = await messService.searchMesses({
        lat: userLat,
        lng: userLng,
        radiusMeters: 3000
      });

      // 1. PostGIS query was executed
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      // 2. Standard findMany was NOT called
      expect(mockPrisma.mess.findMany).not.toHaveBeenCalled();
      // 3. Results returned with exact PostGIS distance
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('mess-1');
      expect(result.data[0].distanceMeters).toBe(450);
    });

    it('should propagate PostGIS errors loudly and NEVER silently swallow or fall back', async () => {
      const userLat = 22.7196;
      const userLng = 75.8577;

      // Simulate a genuine PostGIS failure (e.g. extension missing or syntax error)
      mockPrisma.$queryRaw.mockRejectedValue(new Error('relation "spatial_ref_sys" does not exist'));

      // Assert error throws loudly
      await expect(
        messService.searchMesses({
          lat: userLat,
          lng: userLng,
          radiusMeters: 5000
        })
      ).rejects.toThrow('relation "spatial_ref_sys" does not exist');

      // Assert it did NOT fall into standard findMany silently
      expect(mockPrisma.mess.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Non-Spatial Relational Queries (Coordinates Omitted)', () => {
    it('should execute standard relational query when lat/lng are omitted', async () => {
      const mockMesses = [
        {
          id: 'mess-2',
          name: 'Sarafa Mess',
          avgRating: 4.6,
          consistencyScore: 88,
          isVeg: false,
          cuisineTypes: ['Malwi'],
          city: 'Indore',
          status: 'ACTIVE'
        }
      ];

      mockPrisma.mess.count.mockResolvedValue(1);
      mockPrisma.mess.findMany.mockResolvedValue(mockMesses);

      const result = await messService.searchMesses({
        city: 'Indore',
        isVeg: false
      });

      // PostGIS was NOT called because coordinates are omitted
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
      expect(mockPrisma.mess.findMany).toHaveBeenCalled();
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Sarafa Mess');
    });
  });

  describe('Daily Menu Slots Remaining & Cutoff Calculation', () => {
    it('should derive remaining slots and cutoff status correctly', async () => {
      const futureCutoff = new Date(Date.now() + 3600000); // 1 hour in future
      const pastCutoff = new Date(Date.now() - 3600000);   // 1 hour in past

      mockPrisma.dailyMenu.findMany.mockResolvedValue([
        {
          id: 'dm-1',
          mealType: 'LUNCH',
          date: new Date(),
          capacity: 50,
          ordersPlaced: 42,
          cutoffTime: futureCutoff,
          items: []
        },
        {
          id: 'dm-2',
          mealType: 'DINNER',
          date: new Date(),
          capacity: 30,
          ordersPlaced: 30,
          cutoffTime: pastCutoff,
          items: []
        }
      ]);

      const menus = await messService.getMessMenu('mess-1', {});

      expect(menus.length).toBe(2);
      // Lunch: 50 - 42 = 8 slots remaining, cutoff not passed
      expect(menus[0].slotsRemaining).toBe(8);
      expect(menus[0].isCutoffPassed).toBe(false);

      // Dinner: 30 - 30 = 0 slots remaining, cutoff passed
      expect(menus[1].slotsRemaining).toBe(0);
      expect(menus[1].isCutoffPassed).toBe(true);
    });
  });
});
