import { prisma } from '@lib/prisma';
import { deleteObjectByKey } from '@lib/s3';

/**
 * Remove a user's avatar. Deletes the object from S3 first; only after
 * a successful S3 deletion will it clear avatarKey/avatarUrl in DB.
 *
 * Throws on S3 deletion failure; does not modify DB in that case.
 */
export async function removeUserAvatarStrict(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });

  const key = user?.avatarKey ?? null;
  if (!key) {
    // Nothing to delete; just ensure DB is cleared
    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: null, avatarUrl: null },
      select: { id: true },
    });
    return { deletedFromS3: false, clearedDb: true };
  }

  // Delete from S3 first; propagate any error to caller
  await deleteObjectByKey(key);

  await prisma.user.update({
    where: { id: userId },
    data: { avatarKey: null, avatarUrl: null },
    select: { id: true },
  });

  return { deletedFromS3: true, clearedDb: true };
}
