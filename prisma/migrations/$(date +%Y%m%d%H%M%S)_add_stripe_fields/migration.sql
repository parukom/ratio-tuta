-- AlterTable
ALTER TABLE "Package" ADD COLUMN "stripeProductId" TEXT,
ADD COLUMN "stripeMonthlyPriceId" TEXT,
ADD COLUMN "stripeAnnualPriceId" TEXT;

-- AlterTable
ALTER TABLE "TeamSubscription" ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripePriceId" TEXT,
ADD COLUMN "cancelAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Package_stripeProductId_key" ON "Package"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSubscription_stripeSubscriptionId_key" ON "TeamSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSubscription_stripeCheckoutSessionId_key" ON "TeamSubscription"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "TeamSubscription_stripeCustomerId_idx" ON "TeamSubscription"("stripeCustomerId");
