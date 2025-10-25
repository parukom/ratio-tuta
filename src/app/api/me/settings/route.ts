import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { logAudit } from '@lib/logger';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { showHelp: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ showHelp: user.showHelp }, { status: 200 });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'user.settings.update',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { showHelp?: boolean };

  if (typeof body.showHelp !== 'boolean') {
    return NextResponse.json(
      { error: 'Invalid showHelp value' },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { showHelp: body.showHelp },
      select: { id: true, showHelp: true },
    });

    await logAudit({
      action: 'user.settings.update',
      status: 'SUCCESS',
      actor: session,
      metadata: { showHelp: body.showHelp },
    });

    return NextResponse.json({ showHelp: updated.showHelp }, { status: 200 });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'user.settings.update',
      status: 'ERROR',
      actor: session,
      message: 'Failed to update settings',
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
