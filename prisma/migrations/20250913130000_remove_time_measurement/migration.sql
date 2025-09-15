-- Migration: remove TIME from MeasurementType enum
-- Strategy (PostgreSQL):
-- 1. Update existing rows having measurementType = 'TIME' -> 'PCS'
-- 2. Create new enum without TIME
-- 3. Alter column to use new enum via type cast

DO $$
BEGIN
  -- Step 1: normalize data
  UPDATE "Item" SET "measurementType" = 'PCS' WHERE "measurementType" = 'TIME';
  -- Step 2: drop default to allow type change
  ALTER TABLE "Item" ALTER COLUMN "measurementType" DROP DEFAULT;

  -- Step 3: rename old enum
  ALTER TYPE "MeasurementType" RENAME TO "MeasurementType_old";

  -- Step 4: create new enum without TIME
  CREATE TYPE "MeasurementType" AS ENUM ('PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA');

  -- Step 5: alter column to new enum using text cast
  ALTER TABLE "Item" ALTER COLUMN "measurementType" TYPE "MeasurementType" USING "measurementType"::text::"MeasurementType";

  -- Step 6: set default back to PCS
  ALTER TABLE "Item" ALTER COLUMN "measurementType" SET DEFAULT 'PCS';

  -- Step 7: drop old enum
  DROP TYPE "MeasurementType_old";
END;
$$;
