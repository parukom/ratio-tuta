-- CreateEnum
CREATE TYPE "public"."AuditStatus" AS ENUM ('SUCCESS', 'ERROR', 'DENIED');

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "status" "public"."AuditStatus" NOT NULL,
    "message" TEXT,
    "actorUserId" INTEGER,
    "teamId" INTEGER,
    "targetTable" TEXT,
    "targetId" INTEGER,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "public"."AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_timestamp_idx" ON "public"."AuditLog"("actorUserId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_teamId_timestamp_idx" ON "public"."AuditLog"("teamId", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
