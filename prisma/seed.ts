// Explicitly import the generated Prisma client entry file to avoid Node ESM directory import error
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    {
      slug: 'free',
      name: 'FREE',
      description: 'Free tier for trying the product',
      monthlyCents: 0,
      annualCents: 0,
      features: [
        'Up to one place',
        'Up to 30 items',
        'Up to 2000 sales per month',
        'Up to 1 team mate',
        '3 months of storing data',
      ],
      metadata: undefined,
    },
    {
      slug: 'pro10',
      name: 'PRO 10',
      description: 'Small teams',
      monthlyCents: 1000,
      annualCents: 10000,
      features: [
        'Up to 2 places',
        'Up to 120 items',
        'Up to 8000 sales per month',
        'Up to 4 team mates',
        '10 months of storing data',
      ],
      metadata: undefined,
    },
    {
      slug: 'premium20',
      name: 'PREMIUM 20',
      description: 'For growing businesses',
      monthlyCents: 2000,
      annualCents: 20000,
      features: [
        'Up to 5 places',
        'Up to 250 items',
        'Up to 20000 sales per month',
        'Up to 25 workers',
        '24 months of storing data',
        'Better image quality',
        'Document storage up to 1GB',
        '€0.49 for extra GB',
      ],
      metadata: undefined,
    },
    {
      slug: 'enterprise',
      name: 'ENTERPRISE',
      description: 'Contact us for custom pricing',
      monthlyCents: 0,
      annualCents: 0,
      features: [
        'Unlimited places',
        'Unlimited items',
        'Unlimited sales',
        'Unlimited workers',
        'Unlimited months of storing data',
        'Best image quality',
        'Unlimited document storage',
      ],
      metadata: undefined,
    },
  ];

  for (const p of packages) {
    await prisma.package.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        monthlyCents: p.monthlyCents,
        annualCents: p.annualCents,
        features: p.features,
        metadata: p.metadata,
        isActive: true,
      },
      create: p,
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
