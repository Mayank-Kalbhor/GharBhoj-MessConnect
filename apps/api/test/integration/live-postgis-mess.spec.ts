import { PrismaService } from '../../src/prisma/prisma.service';
import { MessService } from '../../src/modules/mess/mess.service';
import { MessStatus, UserRole } from '@messconnect/shared-types';

describe('Live PostGIS Spatial Discovery Integration (Real Supabase PostgreSQL Engine)', () => {
  let prisma: PrismaService;
  let messService: MessService;
  let testVendorId: string;
  let nearMessId: string;
  let farMessId: string;
  let inactiveMessId: string;

  // Search reference point: Bhawarkua Square, Indore (22.6886° N, 75.8676° E)
  const SEARCH_LAT = 22.6886;
  const SEARCH_LNG = 75.8676;
  jest.setTimeout(60000);

  beforeAll(async () => {
    // 1. Initialize genuine unmocked PrismaService against live Supabase instance with exact encoded credentials
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
    messService = new MessService(prisma);

    // 2. Clean up any previous test messes and users
    await prisma.mess.deleteMany({
      where: { name: { startsWith: 'TEST_LIVE_POSTGIS_' } }
    });
    await prisma.user.deleteMany({
      where: { phone: { startsWith: '+91999998888' } }
    });

    // 3. Create 3 distinct test vendor users (since Mess.ownerId is @unique)
    const vendor1 = await prisma.user.create({
      data: {
        phone: '+919999988881',
        fullName: 'TEST_LIVE_POSTGIS_Vendor_1',
        role: UserRole.VENDOR,
        firebaseUid: 'mock_live_test_v1'
      }
    });

    const vendor2 = await prisma.user.create({
      data: {
        phone: '+919999988882',
        fullName: 'TEST_LIVE_POSTGIS_Vendor_2',
        role: UserRole.VENDOR,
        firebaseUid: 'mock_live_test_v2'
      }
    });

    const vendor3 = await prisma.user.create({
      data: {
        phone: '+919999988883',
        fullName: 'TEST_LIVE_POSTGIS_Vendor_3',
        role: UserRole.VENDOR,
        firebaseUid: 'mock_live_test_v3'
      }
    });

    // 4. Insert real Mess rows with concrete Indore coordinates
    // Mess A (Near): ~445 meters north of Bhawarkua Square (Bholaram Ustad Marg)
    const nearMess = await prisma.mess.create({
      data: {
        ownerId: vendor1.id,
        name: 'TEST_LIVE_POSTGIS_Annapurna_Near',
        fssaiLicenseNumber: 'FSSAI_TEST_101',
        city: 'Indore',
        addressLine: 'Bholaram Ustad Marg, Bhawarkua, Indore',
        latitude: 22.6926,
        longitude: 75.8676,
        status: MessStatus.ACTIVE,
        isVeg: true,
        cuisineTypes: ['North Indian', 'Malwi'],
        avgRating: 4.8,
        consistencyScore: 95
      }
    });
    nearMessId = nearMess.id;

    // Mess B (Far): ~7.5 km north-east of Bhawarkua Square (Vijay Nagar, Indore)
    const farMess = await prisma.mess.create({
      data: {
        ownerId: vendor2.id,
        name: 'TEST_LIVE_POSTGIS_VijayNagar_Far',
        fssaiLicenseNumber: 'FSSAI_TEST_102',
        city: 'Indore',
        addressLine: 'Scheme 54, Vijay Nagar, Indore',
        latitude: 22.7533,
        longitude: 75.8937,
        status: MessStatus.ACTIVE,
        isVeg: false,
        cuisineTypes: ['South Indian'],
        avgRating: 4.2,
        consistencyScore: 88
      }
    });
    farMessId = farMess.id;

    // Mess C (Inactive Near): ~380 meters away, but PENDING_APPROVAL
    const inactiveMess = await prisma.mess.create({
      data: {
        ownerId: vendor3.id,
        name: 'TEST_LIVE_POSTGIS_Pending_Inactive',
        fssaiLicenseNumber: 'FSSAI_TEST_103',
        city: 'Indore',
        addressLine: 'Tower Square, Indore',
        latitude: 22.6920,
        longitude: 75.8670,
        status: MessStatus.PENDING_APPROVAL,
        isVeg: true,
        cuisineTypes: ['North Indian'],
        avgRating: 0.0,
        consistencyScore: 100
      }
    });
    inactiveMessId = inactiveMess.id;
  }, 30000);

  afterAll(async () => {
    // Clean up test rows
    if (prisma) {
      await prisma.mess.deleteMany({
        where: { name: { startsWith: 'TEST_LIVE_POSTGIS_' } }
      });
      await prisma.user.deleteMany({
        where: { phone: { startsWith: '+91999998888' } }
      });
      await prisma.$disconnect();
    }
  }, 30000);

  it('should verify PostGIS ST_DWithin filters out messes beyond the specified radius', async () => {
    // Search with 3000m (3km) radius
    const result = await messService.searchMesses({
      lat: SEARCH_LAT,
      lng: SEARCH_LNG,
      radiusMeters: 3000
    });

    const returnedNames = result.data.map(m => m.name);
    
    // Near mess (~445m) MUST be included
    expect(returnedNames).toContain('TEST_LIVE_POSTGIS_Annapurna_Near');

    // Far mess (~7500m) MUST be excluded by PostGIS ST_DWithin
    expect(returnedNames).not.toContain('TEST_LIVE_POSTGIS_VijayNagar_Far');

    // Inactive mess MUST be excluded by status filter
    expect(returnedNames).not.toContain('TEST_LIVE_POSTGIS_Pending_Inactive');
  });

  it('should verify PostGIS ST_Distance calculates accurate spherical distance in meters', async () => {
    const result = await messService.searchMesses({
      lat: SEARCH_LAT,
      lng: SEARCH_LNG,
      radiusMeters: 10000 // 10km radius covers both active messes
    });

    const nearResult = result.data.find(m => m.name === 'TEST_LIVE_POSTGIS_Annapurna_Near');
    const farResult = result.data.find(m => m.name === 'TEST_LIVE_POSTGIS_VijayNagar_Far');

    expect(nearResult).toBeDefined();
    expect(farResult).toBeDefined();

    // Actual geodesic distance from 22.6886, 75.8676 to 22.6926, 75.8676 is ~445 meters
    expect(nearResult.distanceMeters).toBeGreaterThanOrEqual(440);
    expect(nearResult.distanceMeters).toBeLessThanOrEqual(455);

    // Actual geodesic distance to Vijay Nagar is ~7.5 km (7200 - 7800 meters)
    expect(farResult.distanceMeters).toBeGreaterThanOrEqual(7200);
    expect(farResult.distanceMeters).toBeLessThanOrEqual(7800);

    // Verify ordering by distanceMeters ASC
    const nearIdx = result.data.findIndex(m => m.name === 'TEST_LIVE_POSTGIS_Annapurna_Near');
    const farIdx = result.data.findIndex(m => m.name === 'TEST_LIVE_POSTGIS_VijayNagar_Far');
    expect(nearIdx).toBeLessThan(farIdx);
  });

  it('should combine PostGIS spatial predicates with relational filters (isVeg: true)', async () => {
    const result = await messService.searchMesses({
      lat: SEARCH_LAT,
      lng: SEARCH_LNG,
      radiusMeters: 10000,
      isVeg: true
    });

    const returnedNames = result.data.map(m => m.name);
    expect(returnedNames).toContain('TEST_LIVE_POSTGIS_Annapurna_Near');
    expect(returnedNames).not.toContain('TEST_LIVE_POSTGIS_VijayNagar_Far'); // Excluded because isVeg is false
  });
});
