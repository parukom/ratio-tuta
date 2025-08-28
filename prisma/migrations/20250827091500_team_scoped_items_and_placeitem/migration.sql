-- Team-scoped items and PlaceItem join with quantity
-- 1) Add teamId to Item and backfill from Place.teamId via existing placeId
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "teamId" INTEGER;

UPDATE "Item" i
SET "teamId" = p."teamId"
FROM "Place" p
WHERE i."placeId" = p."id" AND i."teamId" IS NULL;

-- 2) Make teamId NOT NULL
ALTER TABLE "Item" ALTER COLUMN "teamId" SET NOT NULL;

-- 3) Drop constraints/indexes on placeId and FK to Place
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Item_placeId_fkey'
  ) THEN
    ALTER TABLE "Item" DROP CONSTRAINT "Item_placeId_fkey";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Item_placeId_name_key'
  ) THEN
    ALTER TABLE "Item" DROP CONSTRAINT "Item_placeId_name_key";
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Item_placeId_sku_key'
  ) THEN
    ALTER TABLE "Item" DROP CONSTRAINT "Item_placeId_sku_key";
  END IF;
END $$;

DROP INDEX IF EXISTS "Item_placeId_idx";

-- 4) Add FK from Item.teamId to Team(id)
ALTER TABLE "Item"
  ADD CONSTRAINT "Item_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Add new unique constraints and index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Item_teamId_name_key'
  ) THEN
    CREATE UNIQUE INDEX "Item_teamId_name_key" ON "Item"("teamId", "name");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Item_teamId_sku_key'
  ) THEN
    CREATE UNIQUE INDEX "Item_teamId_sku_key" ON "Item"("teamId", "sku");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Item_teamId_idx'
  ) THEN
    CREATE INDEX "Item_teamId_idx" ON "Item"("teamId");
  END IF;
END $$;

-- 6) Drop placeId column
ALTER TABLE "Item" DROP COLUMN IF EXISTS "placeId";

-- 7) Create PlaceItem join table
CREATE TABLE IF NOT EXISTS "PlaceItem" (
  "id" SERIAL PRIMARY KEY,
  "placeId" INTEGER NOT NULL,
  "itemId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- FKs for PlaceItem
ALTER TABLE "PlaceItem"
  ADD CONSTRAINT "PlaceItem_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlaceItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for PlaceItem
CREATE UNIQUE INDEX IF NOT EXISTS "PlaceItem_placeId_itemId_key" ON "PlaceItem"("placeId", "itemId");
CREATE INDEX IF NOT EXISTS "PlaceItem_placeId_idx" ON "PlaceItem"("placeId");
CREATE INDEX IF NOT EXISTS "PlaceItem_itemId_idx" ON "PlaceItem"("itemId");
