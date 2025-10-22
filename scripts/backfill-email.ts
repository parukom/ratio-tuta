/*
  Backfill emailHmac and emailEnc for existing users.
  Usage (node): ts-node scripts/backfill-email.ts or compile and run with node.
*/
import { prisma } from '@lib/prisma';
import { hmacEmail, encryptEmail, normalizeEmail } from '@lib/crypto';

async function main() {
  const users = (await prisma.user.findMany({
    select: { id: true, emailHmac: true, emailEnc: true },
  })) as Array<{ id: string; email: string | null; emailHmac?: string | null; emailEnc?: string | null }>;
  let updated = 0;
  for (const u of users) {
    const email = (u as any).email as string | null;
    if (!email) continue;
    const norm = normalizeEmail(email);
    const needsHmac = !(u as any).emailHmac;
    const needsEnc = !(u as any).emailEnc;
    if (!needsHmac && !needsEnc) continue;
    await prisma.user.update({
      where: { id: u.id },
      // @ts-ignore fields added by migration
      data: {
        ...(needsHmac ? { emailHmac: hmacEmail(norm) } : {}),
        ...(needsEnc ? { emailEnc: encryptEmail(norm) } : {}),
      },
    });
    updated++;
  }
  console.log(`Backfill complete. Updated ${updated} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
