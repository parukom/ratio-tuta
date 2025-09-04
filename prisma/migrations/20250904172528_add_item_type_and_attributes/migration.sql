-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "itemTypeId" TEXT;

-- CreateTable
CREATE TABLE "public"."ItemType" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "placeTypeId" TEXT,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemType_teamId_idx" ON "public"."ItemType"("teamId");

-- CreateIndex
CREATE INDEX "ItemType_placeTypeId_idx" ON "public"."ItemType"("placeTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemType_teamId_slug_key" ON "public"."ItemType"("teamId", "slug");

-- CreateIndex
CREATE INDEX "Item_itemTypeId_idx" ON "public"."Item"("itemTypeId");

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "public"."ItemType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemType" ADD CONSTRAINT "ItemType_placeTypeId_fkey" FOREIGN KEY ("placeTypeId") REFERENCES "public"."PlaceType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemType" ADD CONSTRAINT "ItemType_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
