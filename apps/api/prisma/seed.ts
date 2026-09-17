import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLaunchCity() {
  const launchCity = process.env.LAUNCH_CITY_NAME || 'Indore';
  const defaultCommission = process.env.DEFAULT_COMMISSION_PERCENTAGE || '14.00';

  console.log(`[Seed] Seeding launch city config: ${launchCity} with ${defaultCommission}% commission...`);

  const cityConfig = await prisma.cityConfig.upsert({
    where: { cityName: launchCity },
    update: {
      commissionPercentage: new Prisma.Decimal(defaultCommission),
      isActive: true
    },
    create: {
      cityName: launchCity,
      commissionPercentage: new Prisma.Decimal(defaultCommission),
      isActive: true
    }
  });

  console.log(`[Seed] Successfully seeded CityConfig for ${cityConfig.cityName} (ID: ${cityConfig.id}, Commission: ${cityConfig.commissionPercentage}%)`);
  return cityConfig;
}

if (require.main === module) {
  seedLaunchCity()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
