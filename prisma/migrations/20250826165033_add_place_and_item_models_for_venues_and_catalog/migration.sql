/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."PlaceType" AS ENUM ('FOOD_TRUCK', 'SHOP', 'KIOSK', 'STALL', 'CART', 'EVENT_VENUE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ItemCategory" AS ENUM ('FOOD', 'DRINK', 'TICKET', 'MERCH', 'OTHER');

-- CreateTable
CREATE TABLE "public"."Place" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."PlaceType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "timezone" TEXT,
    "currency" TEXT DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" "public"."ItemCategory" NOT NULL DEFAULT 'OTHER',
    "priceCents" INTEGER NOT NULL,
    "taxRateBps" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Place_teamId_idx" ON "public"."Place"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Place_teamId_name_key" ON "public"."Place"("teamId", "name");

-- CreateIndex
CREATE INDEX "Item_placeId_idx" ON "public"."Item"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_placeId_name_key" ON "public"."Item"("placeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_placeId_sku_key" ON "public"."Item"("placeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "public"."TeamMember"("userId");

-- AddForeignKey
ALTER TABLE "public"."Place" ADD CONSTRAINT "Place_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
