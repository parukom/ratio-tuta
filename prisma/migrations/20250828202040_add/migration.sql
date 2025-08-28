-- CreateTable
CREATE TABLE "public"."PlaceMember" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceMember_userId_idx" ON "public"."PlaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceMember_placeId_userId_key" ON "public"."PlaceMember"("placeId", "userId");

-- AddForeignKey
ALTER TABLE "public"."PlaceMember" ADD CONSTRAINT "PlaceMember_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PlaceMember" ADD CONSTRAINT "PlaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
