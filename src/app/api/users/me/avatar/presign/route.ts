import { NextResponse } from 'next/server';
import { getSession } from '@lib/session';
import { extFromContentType, getPresignedPutUrl } from '@lib/s3';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const contentType =
      typeof body?.contentType === 'string' ? body.contentType : '';
    const ext = extFromContentType(contentType);
    if (!ext) {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 },
      );
    }
    // limit size client-side; server cannot enforce on presign other than put limits
    const key = `avatars/${session.userId}.${ext}`;
    const url = await getPresignedPutUrl({ key, contentType, expiresSec: 60 });
    return NextResponse.json({ url, key });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
