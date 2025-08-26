/*
  Warnings:

  - You are about to drop the column `category` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Place` table. All the data in the column will be lost.
  - Added the required column `price` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "category",
DROP COLUMN "priceCents",
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Place" DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "type",
ADD COLUMN     "placeTypeId" INTEGER;

-- DropEnum
DROP TYPE "public"."ItemCategory";

-- DropEnum
DROP TYPE "public"."PlaceType";

-- CreateTable
CREATE TABLE "public"."PlaceType" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemCategory" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceType_teamId_idx" ON "public"."PlaceType"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceType_teamId_name_key" ON "public"."PlaceType"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceType_teamId_slug_key" ON "public"."PlaceType"("teamId", "slug");

-- CreateIndex
CREATE INDEX "ItemCategory_teamId_idx" ON "public"."ItemCategory"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_teamId_name_key" ON "public"."ItemCategory"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ItemCategory_teamId_slug_key" ON "public"."ItemCategory"("teamId", "slug");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "public"."Item"("categoryId");

-- CreateIndex
CREATE INDEX "Place_placeTypeId_idx" ON "public"."Place"("placeTypeId");

-- AddForeignKey
ALTER TABLE "public"."Place" ADD CONSTRAINT "Place_placeTypeId_fkey" FOREIGN KEY ("placeTypeId") REFERENCES "public"."PlaceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlaceType" ADD CONSTRAINT "PlaceType_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemCategory" ADD CONSTRAINT "ItemCategory_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
