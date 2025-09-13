-- Migration: remove TIME from MeasurementType enum
-- Strategy (PostgreSQL):
-- 1. Update existing rows having measurementType = 'TIME' -> 'PCS'
-- 2. Create new enum without TIME
-- 3. Alter column to use new enum via type cast

DO $$
BEGIN
  -- Step 1: normalize data
  UPDATE "Item" SET "measurementType" = 'PCS' WHERE "measurementType" = 'TIME';

  -- Step 2: rename old enum
  ALTER TYPE "MeasurementType" RENAME TO "MeasurementType_old";

  -- Step 3: create new enum without TIME
  CREATE TYPE "MeasurementType" AS ENUM ('PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA');

  -- Step 4: alter column to new enum
  ALTER TABLE "Item" ALTER COLUMN "measurementType" TYPE "MeasurementType" USING "measurementType"::text::"MeasurementType";

  -- Step 5: drop old enum
  DROP TYPE "MeasurementType_old";
END;
$$;
