// Deprecated: client now posts file to /api/users/me/avatar/upload for server-side processing.
import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { extFromContentType, getPresignedPutUrl } from '@lib/s3';
import { logAudit } from '@lib/logger';
import { rateLimit, strictAuthLimiter } from '@lib/rate-limit-redis';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    await logAudit({
      action: 'avatar.presign',
      status: 'DENIED',
      message: 'Unauthorized',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // SECURITY FIX: Rate limiting to prevent abuse of presigned URL generation
  const rateLimitResult = await rateLimit(req, strictAuthLimiter, 10); // 10 per 15 min
  if (!rateLimitResult.success) {
    await logAudit({
      action: 'avatar.presign',
      status: 'DENIED',
      message: 'Rate limit exceeded',
      actor: session,
    });
    return NextResponse.json(
      { error: 'Too many upload requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
          'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
        }
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const contentType =
      typeof body?.contentType === 'string' ? body.contentType : '';

    // SECURITY FIX: Validate content type
    const ext = extFromContentType(contentType);
    if (!ext) {
      await logAudit({
        action: 'avatar.presign',
        status: 'DENIED',
        message: 'Unsupported content type',
        actor: session,
        metadata: { contentType },
      });
      return NextResponse.json(
        { error: 'Unsupported content type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 },
      );
    }

    // SECURITY FIX: Use user ID in key to prevent enumeration/collision
    const key = `avatars/${session.userId}.${ext}`;

    // SECURITY FIX: Generate presigned URL with size limits
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit for avatars
    const url = await getPresignedPutUrl({
      key,
      contentType,
      expiresSec: 60, // Short expiry
      maxSizeBytes,
    });

    await logAudit({
      action: 'avatar.presign',
      status: 'SUCCESS',
      actor: session,
      metadata: { key, contentType, maxSizeBytes },
    });

    return NextResponse.json({
      url,
      key,
      expiresIn: 60,
      maxSizeBytes,
    });
  } catch (e) {
    await logAudit({
      action: 'avatar.presign',
      status: 'ERROR',
      message: e instanceof Error ? e.message : 'Server error',
      actor: session,
    });
    console.error(e);

    // SECURITY FIX: Generic error message in production
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: isDev && e instanceof Error
          ? e.message
          : 'Unable to generate upload URL. Please try again later.'
      },
      { status: 500 }
    );
  }
}
