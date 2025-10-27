-- AlterTable: Add isUnlimited column to Item
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "isUnlimited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add Stripe fields to Package
ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "stripeProductId" TEXT;
ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "stripeMonthlyPriceId" TEXT;
ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "stripeAnnualPriceId" TEXT;

-- CreateIndex: Add unique index on Package.stripeProductId
CREATE UNIQUE INDEX IF NOT EXISTS "Package_stripeProductId_key" ON "Package"("stripeProductId");

-- AlterTable: Add Stripe and cancellation fields to TeamSubscription
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "stripeCheckoutSessionId" TEXT;
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "cancelAt" TIMESTAMP(3);
ALTER TABLE "TeamSubscription" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);

-- CreateIndex: Add unique index on TeamSubscription.stripeSubscriptionId
CREATE UNIQUE INDEX IF NOT EXISTS "TeamSubscription_stripeSubscriptionId_key" ON "TeamSubscription"("stripeSubscriptionId");

-- CreateIndex: Add unique index on TeamSubscription.stripeCheckoutSessionId
CREATE UNIQUE INDEX IF NOT EXISTS "TeamSubscription_stripeCheckoutSessionId_key" ON "TeamSubscription"("stripeCheckoutSessionId");

-- CreateIndex: Add index on TeamSubscription.stripeCustomerId
CREATE INDEX IF NOT EXISTS "TeamSubscription_stripeCustomerId_idx" ON "TeamSubscription"("stripeCustomerId");
