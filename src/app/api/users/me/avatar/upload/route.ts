import { NextResponse } from 'next/server';
import { getSession, setSession } from '@lib/session';
import { prisma } from '@lib/prisma';
import { deleteObjectByKey, putObjectFromBuffer } from '@lib/s3';
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

    // Validate file size
    if (file.size > 5_000_000) {
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 },
      );
    }

    // Validate file type by MIME type (first check)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images allowed (JPEG, PNG, WebP, GIF)' },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Validate magic bytes (file signature)
    const magicNumbers = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF
    };

    const isValidImage =
      (buf[0] === magicNumbers.jpeg[0] && buf[1] === magicNumbers.jpeg[1] && buf[2] === magicNumbers.jpeg[2]) ||
      (buf[0] === magicNumbers.png[0] && buf[1] === magicNumbers.png[1] && buf[2] === magicNumbers.png[2] && buf[3] === magicNumbers.png[3]) ||
      (buf[0] === magicNumbers.gif[0] && buf[1] === magicNumbers.gif[1] && buf[2] === magicNumbers.gif[2]) ||
      (buf[0] === magicNumbers.webp[0] && buf[1] === magicNumbers.webp[1] && buf[2] === magicNumbers.webp[2] && buf[3] === magicNumbers.webp[3]);

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image file. File signature verification failed.' },
        { status: 400 },
      );
    }

    // If a previous avatar exists, remove it from S3 first
    const existing = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarKey: true },
    });
    if (existing?.avatarKey) {
      await deleteObjectByKey(existing.avatarKey);
    }

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
