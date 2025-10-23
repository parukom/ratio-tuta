import Stripe from 'stripe';
import { PrismaClient } from '../src/generated/prisma/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const prisma = new PrismaClient();

async function syncStripeProducts() {
  console.log('Starting Stripe products sync...\n');

  const packages = await prisma.package.findMany({
    where: {
      isActive: true,
      monthlyCents: { gt: 0 }, // Skip free packages
    },
  });

  for (const pkg of packages) {
    console.log(`\n📦 Processing package: ${pkg.name} (${pkg.slug})`);

    try {
      let stripeProduct: Stripe.Product;

      // Check if product already exists in Stripe
      if (pkg.stripeProductId) {
        console.log(`  Found existing Stripe product: ${pkg.stripeProductId}`);
        stripeProduct = await stripe.products.retrieve(pkg.stripeProductId);
      } else {
        // Create new product in Stripe
        console.log('  Creating new Stripe product...');
        stripeProduct = await stripe.products.create({
          name: pkg.name,
          description: pkg.description || undefined,
          metadata: {
            packageId: pkg.id,
            packageSlug: pkg.slug,
          },
        });
        console.log(`  ✓ Created product: ${stripeProduct.id}`);
      }

      // Create or update monthly price
      let monthlyPriceId = pkg.stripeMonthlyPriceId;
      if (!monthlyPriceId) {
        console.log('  Creating monthly price...');
        const monthlyPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: pkg.monthlyCents,
          currency: 'eur',
          recurring: {
            interval: 'month',
          },
          metadata: {
            packageId: pkg.id,
            packageSlug: pkg.slug,
            billingPeriod: 'monthly',
          },
        });
        monthlyPriceId = monthlyPrice.id;
        console.log(`  ✓ Created monthly price: ${monthlyPriceId}`);
      } else {
        console.log(`  Monthly price exists: ${monthlyPriceId}`);
      }

      // Create or update annual price
      let annualPriceId = pkg.stripeAnnualPriceId;
      if (pkg.annualCents > 0) {
        if (!annualPriceId) {
          console.log('  Creating annual price...');
          const annualPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: pkg.annualCents,
            currency: 'eur',
            recurring: {
              interval: 'year',
            },
            metadata: {
              packageId: pkg.id,
              packageSlug: pkg.slug,
              billingPeriod: 'annual',
            },
          });
          annualPriceId = annualPrice.id;
          console.log(`  ✓ Created annual price: ${annualPriceId}`);
        } else {
          console.log(`  Annual price exists: ${annualPriceId}`);
        }
      }

      // Update package with Stripe IDs
      await prisma.package.update({
        where: { id: pkg.id },
        data: {
          stripeProductId: stripeProduct.id,
          stripeMonthlyPriceId: monthlyPriceId,
          stripeAnnualPriceId: annualPriceId || null,
        },
      });

      console.log(`  ✓ Updated package in database`);
      console.log(`\n  Summary for ${pkg.name}:`);
      console.log(`    Product ID: ${stripeProduct.id}`);
      console.log(`    Monthly Price ID: ${monthlyPriceId}`);
      if (annualPriceId) {
        console.log(`    Annual Price ID: ${annualPriceId}`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${pkg.name}:`, error);
    }
  }

  console.log('\n✅ Stripe sync completed!\n');
}

syncStripeProducts()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
