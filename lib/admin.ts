import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_session';
// 会话令牌必须来自 ADMIN_SECRET；未配置时后台锁死（登录接口会明确提示）
const ADMIN_COOKIE_VALUE = process.env.ADMIN_SECRET ?? '';

export function isAdminRequest(req: NextRequest): boolean {
  if (!ADMIN_COOKIE_VALUE) return false;
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  return cookie?.value === ADMIN_COOKIE_VALUE;
}

export function requireAdminMiddleware(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminOnServer(): Promise<boolean> {
  if (!ADMIN_COOKIE_VALUE) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}
