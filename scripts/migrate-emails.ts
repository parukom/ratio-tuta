/**
 * Email Storage Migration Script
 *
 * Migrates legacy plaintext email field to encrypted+hashed storage.
 * After running this script, the plaintext email field can be safely removed.
 *
 * Usage:
 *   npx tsx scripts/migrate-emails.ts
 *   npx tsx scripts/migrate-emails.ts --dry-run  # Preview changes without applying
 */

import { prisma } from '../lib/prisma';
import { hmacEmail, encryptEmail, normalizeEmail } from '../lib/crypto';

async function migrateEmails(dryRun: boolean = false) {
  console.log('🔄 Starting email migration...\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }

  // Find users with legacy plaintext email but missing encrypted fields
  const usersToMigrate = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: null } },
        {
          OR: [
            { emailHmac: null },
            { emailEnc: null }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailHmac: true,
      emailEnc: true,
    },
  });

  console.log(`📊 Found ${usersToMigrate.length} users to migrate\n`);

  if (usersToMigrate.length === 0) {
    console.log('✅ All users already migrated!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  for (const user of usersToMigrate) {
    if (!user.email) {
      console.log(`⚠️  Skipping user ${user.id} (${user.name}): No email found`);
      continue;
    }

    try {
      const normalized = normalizeEmail(user.email);
      const emailH = hmacEmail(normalized);
      const emailE = encryptEmail(normalized);

      console.log(`🔐 Migrating user: ${user.name} (${user.id})`);
      console.log(`   Email: ${user.email.substring(0, 3)}***@${user.email.split('@')[1] || '***'}`);
      console.log(`   HMAC: ${emailH.substring(0, 16)}...`);
      console.log(`   Encrypted: ${emailE.substring(0, 20)}...`);

      if (!dryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailHmac: emailH,
            emailEnc: emailE,
          },
        });
        console.log('   ✅ Migrated successfully\n');
      } else {
        console.log('   ⏭️  Skipped (dry run)\n');
      }

      successCount++;
    } catch (error) {
      console.error(`   ❌ Migration failed: ${error}\n`);
      errors.push({
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ userId, error }) => {
      console.log(`   User ${userId}: ${error}`);
    });
  }

  if (!dryRun && successCount > 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify all users can still log in');
    console.log('   2. Run: npx prisma migrate dev --name remove_plaintext_email');
    console.log('   3. Deploy to production');
  }

  console.log('='.repeat(60) + '\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
migrateEmails(dryRun)
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
