import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { deleteObjectByKey } from '@lib/s3';
import { logAudit } from '@lib/logger';

export async function DELETE() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarKey: true },
    });
    const key = user?.avatarKey || null;
    if (key) {
      try {
        await deleteObjectByKey(key);
      } catch {
        /* ignore S3 delete errors */
      }
    }
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatarKey: null, avatarUrl: null },
    });
    await logAudit({
      action: 'user.avatar.delete',
      status: 'SUCCESS',
      actor: session,
      target: { table: 'User', id: session.userId },
    });
    return NextResponse.json({ message: 'Avatar removed' });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'user.avatar.delete',
      status: 'ERROR',
      actor: session,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
