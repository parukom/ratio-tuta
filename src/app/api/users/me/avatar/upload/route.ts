import { NextResponse } from 'next/server';
import { getSession, setSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { putObjectFromBuffer } from '@lib/s3';
import { processImageToWebp } from '@lib/image';
import { logAudit } from '@lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const ctype = req.headers.get('content-type') || '';
    if (!/^multipart\/form-data;/.test(ctype)) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (file.size > 5_000_000) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 },
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());

    // Process to max 640px WEBP
    const processed = await processImageToWebp(buf, {
      maxSize: 640,
      quality: 80,
    });
    const key = `avatars/${session.userId}.${processed.ext}`;

    const url = await putObjectFromBuffer({
      key,
      buffer: processed.data,
      contentType: processed.contentType,
      cacheControl: 'public, max-age=300',
    });

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { avatarKey: key, avatarUrl: url },
      select: { id: true, name: true, role: true, avatarUrl: true },
    });

    // Update session
    await setSession({
      userId: session.userId,
      name: updated.name,
      role: updated.role as 'USER' | 'ADMIN',
    });

    await logAudit({
      action: 'user.avatar.upload',
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
      action: 'user.avatar.upload',
      status: 'ERROR',
      actor: session,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
