import { NextResponse } from 'next/server';
import { getSession, setSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { getPublicUrlForKey, deleteObjectByKey } from '@lib/s3';
import { logAudit } from '@lib/logger';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const key: string | undefined =
      typeof body?.key === 'string' ? body.key : undefined;
    if (!key || !/^avatars\//.test(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarKey: true, name: true, role: true },
    });
    const url = getPublicUrlForKey(key);
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarKey: key, avatarUrl: url },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });
    if (current?.avatarKey && current.avatarKey !== key) {
      try {
        await deleteObjectByKey(current.avatarKey);
      } catch {}
    }
    // keep session name/role unchanged
    await setSession({
      userId: session.userId,
      name: updated.name,
      role: updated.role as 'USER' | 'ADMIN',
    });
    await logAudit({
      action: 'user.avatar.commit',
      status: 'SUCCESS',
      actor: session,
      target: { table: 'User', id: session.userId },
    });
    return NextResponse.json({
      message: 'Avatar updated',
      avatarUrl: updated.avatarUrl,
    });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'user.avatar.commit',
      status: 'ERROR',
      actor: session,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
