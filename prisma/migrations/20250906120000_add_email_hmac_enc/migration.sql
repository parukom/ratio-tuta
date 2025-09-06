-- Add emailHmac and emailEnc to User; keep existing plaintext email for transition
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailHmac" TEXT,
  ADD COLUMN IF NOT EXISTS "emailEnc" TEXT;

-- Add unique index for emailHmac (deterministic lookup)
CREATE UNIQUE INDEX IF NOT EXISTS "User_emailHmac_key" ON "User" ("emailHmac");
