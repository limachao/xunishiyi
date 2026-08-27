import { type NextRequest, NextResponse } from 'next/server';
import { requireAdminMiddleware } from '@/lib/admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (req.method === 'POST') {
      return NextResponse.next();
    }
    return requireAdminMiddleware(req);
  }

  return undefined;
}

export const config = {
  matcher: '/admin/:path*',
};
