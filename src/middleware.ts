import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Deny access to /dashboard when there's no session cookie.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.get('session')?.value;
  if (!hasSession) {
    const url = new URL('/auth?form=login', req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Only run on dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
