import { PrismaClient, MaterialType, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('Password123', 10);

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@ecoloop.com' },
    update: {},
    create: {
      name: 'Green Steel Corp',
      email: 'seller1@ecoloop.com',
      password: hashedPassword,
      role: 'seller' as UserRole,
      username: 'greensteel',
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@ecoloop.com' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'seller2@ecoloop.com',
      password: hashedPassword,
      role: 'seller' as UserRole,
      username: 'alexrivera',
    },
  });

  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@ecoloop.com' },
    update: {},
    create: {
      name: 'Recycle Pro Inc',
      email: 'buyer1@ecoloop.com',
      password: hashedPassword,
      role: 'buyer' as UserRole,
      username: 'recyclepro',
    },
  });

  console.log('Created users:', { seller1, seller2, buyer1 });

  // Create sample listings
  const listing1 = await prisma.listing.create({
    data: {
      title: 'Grade A Plastic Scrap',
      description: 'Industrial polymer, recyclable',
      materialType: MaterialType.PLASTIC,
      quantity: 5.0,
      unit: 'tons',
      price: 165000,
      currency: 'NGN',
      latitude: 6.5244,
      longitude: 3.3792,
      location: 'Lagos, Nigeria',
      notes: 'Material is sorted and baled. Pick-up required between 8 AM and 4 PM.',
      co2Saved: 1.2,
      recyclability: 85,
      sellerId: seller1.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: 'Scrap Aluminum Mix',
      description: 'Mixed aluminum scrap, clean',
      materialType: MaterialType.METAL,
      quantity: 500,
      unit: 'kg',
      price: 850,
      currency: 'NGN',
      latitude: 6.5244,
      longitude: 3.3792,
      location: 'Lagos, Nigeria',
      sellerId: seller2.id,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: 'Recycled Cardboard Bales',
      description: 'Clean cardboard bales, ready for recycling',
      materialType: MaterialType.CARDBOARD,
      quantity: 2.4,
      unit: 'tons',
      price: 1200,
      currency: 'NGN',
      latitude: 6.5244,
      longitude: 3.3792,
      location: 'Lagos, Nigeria',
      sellerId: seller1.id,
    },
  });

  console.log('Created listings:', { listing1, listing2, listing3 });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

