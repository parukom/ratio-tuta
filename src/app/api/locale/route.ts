import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isLocale, locales } from '@/i18n/config';

export async function POST(req: Request) {
  try {
    const { locale } = await req.json().catch(() => ({}));
    // Special case: 'device' clears the cookie to use Accept-Language next time
    if (locale === 'device') {
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'locale',
        value: '',
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 0,
      });
      return NextResponse.json({ ok: true, device: true });
    }
    if (!isLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale', allowed: ['device', ...locales] },
        { status: 400 },
      );
    }
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'locale',
      value: locale,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
