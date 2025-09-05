import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { getSession } from '@lib/session';
import { logAudit } from '@lib/logger';
import { processImageToWebp } from '@lib/image';
import { putObjectFromBuffer, deleteObjectByKey } from '@lib/s3';

export async function POST(
  req: Request,
  context: RouteContext<'/api/items/[itemId]/image'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true, imageKey: true },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await prisma.team.findFirst({
    where: {
      id: item.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ct = req.headers.get('content-type') || '';
  const isForm =
    ct.includes('multipart/form-data') ||
    ct.includes('application/octet-stream');
  if (!isForm) {
    return NextResponse.json(
      { error: 'Expected multipart/form-data or binary body' },
      { status: 415 },
    );
  }

  try {
    let inputBuffer: Buffer | null = null;
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const f = form.get('file');
      if (!f || typeof f === 'string')
        return NextResponse.json(
          { error: 'file is required' },
          { status: 400 },
        );
      const arr = Buffer.from(await f.arrayBuffer());
      inputBuffer = arr;
    } else {
      // raw binary body
      const arr = Buffer.from(await req.arrayBuffer());
      inputBuffer = arr;
    }

    if (!inputBuffer || inputBuffer.length === 0)
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });

    const processed = await processImageToWebp(inputBuffer, {
      maxSize: 1024,
      quality: 82,
    });
    const key = `teams/${item.teamId}/items/${item.id}.${processed.ext}`;
    const publicUrl = await putObjectFromBuffer({
      key,
      buffer: processed.data,
      contentType: processed.contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    });

    // If replacing an existing image, try to delete old key only if unused elsewhere
    if (item.imageKey && item.imageKey !== key) {
      try {
        const others = await prisma.item.count({
          where: { imageKey: item.imageKey, NOT: { id: item.id } },
        });
        if (others === 0) {
          await deleteObjectByKey(item.imageKey);
        }
      } catch (e) {
        console.warn('Failed to delete old item image', e);
      }
    }

    const updated = await prisma.item.update({
      where: { id: item.id },
      data: { imageKey: key, imageUrl: publicUrl },
      select: { id: true, imageUrl: true, imageKey: true },
    });

    await logAudit({
      action: 'item.image.upload',
      status: 'SUCCESS',
      actor: session,
      teamId: item.teamId,
      target: { table: 'Item', id: item.id },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'item.image.upload',
      status: 'ERROR',
      actor: session,
      teamId: item.teamId,
      target: { table: 'Item', id: item.id },
      message: 'Failed to process or upload image',
    });
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: RouteContext<'/api/items/[itemId]/image'>,
) {
  const { itemId } = await context.params;
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!itemId || typeof itemId !== 'string')
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, teamId: true, imageKey: true },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await prisma.team.findFirst({
    where: {
      id: item.teamId,
      OR: [
        { ownerId: session.userId },
        { members: { some: { userId: session.userId } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    if (item.imageKey) {
      // Only delete from storage if no other item references the same key
      const others = await prisma.item.count({
        where: { imageKey: item.imageKey, NOT: { id: item.id } },
      });
      if (others === 0) {
        try {
          await deleteObjectByKey(item.imageKey);
        } catch (e) {
          console.warn('Failed to delete item image from S3', e);
        }
      }
    }
    await prisma.item.update({
      where: { id: item.id },
      data: { imageKey: null, imageUrl: null },
      select: { id: true },
    });
    await logAudit({
      action: 'item.image.delete',
      status: 'SUCCESS',
      actor: session,
      teamId: item.teamId,
      target: { table: 'Item', id: item.id },
    });
    return NextResponse.json({ message: 'Image removed' });
  } catch (e) {
    console.error(e);
    await logAudit({
      action: 'item.image.delete',
      status: 'ERROR',
      actor: session,
      teamId: item.teamId,
      target: { table: 'Item', id: item.id },
      message: 'Failed to delete item image',
    });
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 },
    );
  }
}
