import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { removeUserAvatarStrict } from '@lib/avatar';
import { logAudit } from '@lib/logger';

export async function DELETE() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await removeUserAvatarStrict(session.userId);
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
      message: 'Failed to delete avatar from S3',
    });
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 },
    );
  }
}
