import { type NextRequest, NextResponse } from 'next/server';
import { requireAdminMiddleware } from '@/lib/admin';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 登录页放行（页面和登录 POST 都不走 admin 鉴权）
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

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
