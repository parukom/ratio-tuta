-- AlterTable
ALTER TABLE "public"."ReceiptItem" ADD COLUMN     "measurementType" "public"."MeasurementType" NOT NULL DEFAULT 'PCS';
