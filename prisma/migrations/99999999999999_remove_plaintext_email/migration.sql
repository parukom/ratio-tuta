-- Remove legacy plaintext email field
-- Run this migration ONLY after running scripts/migrate-emails.ts successfully

-- Step 1: Ensure all users have encrypted email fields
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM "User"
  WHERE "emailHmac" IS NULL OR "emailEnc" IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Migration blocked: % users are missing emailHmac or emailEnc. Run scripts/migrate-emails.ts first.', missing_count;
  END IF;
END $$;

-- Step 2: Make encrypted fields NOT NULL
ALTER TABLE "User" ALTER COLUMN "emailHmac" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "emailEnc" SET NOT NULL;

-- Step 3: Drop the legacy plaintext email column
ALTER TABLE "User" DROP COLUMN "email";

-- Step 4: Add comment for documentation
COMMENT ON COLUMN "User"."emailHmac" IS 'HMAC-SHA256 hash of normalized email for lookups';
COMMENT ON COLUMN "User"."emailEnc" IS 'AES-256-GCM encrypted normalized email for display';
