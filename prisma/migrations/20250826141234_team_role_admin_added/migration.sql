-- AlterEnum
ALTER TYPE "public"."TeamRole" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'USER';
