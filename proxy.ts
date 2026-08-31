import { type NextRequest, NextResponse } from 'next/server';
import { requireAdminMiddleware } from '@/lib/admin';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 登录页放行（页面和登录 POST 都不走 admin 鉴权）
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    // 所有 /admin 页面统一走管理员会话校验（登录 API 在 /api/admin 下，不受此 matcher 影响）
    return requireAdminMiddleware(req);
  }

  return undefined;
}

export const config = {
  matcher: '/admin/:path*',
};
