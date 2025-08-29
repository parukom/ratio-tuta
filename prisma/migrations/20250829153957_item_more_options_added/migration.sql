-- CreateEnum
CREATE TYPE "public"."MeasurementType" AS ENUM ('PCS', 'WEIGHT', 'LENGTH', 'VOLUME', 'AREA', 'TIME');

-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "measurementType" "public"."MeasurementType" NOT NULL DEFAULT 'PCS',
ADD COLUMN     "size" TEXT,
ADD COLUMN     "tags" TEXT[];
