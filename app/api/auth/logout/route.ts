import { NextResponse } from 'next/server';
import { destroySession, getSessionTokenFromCookies, clearSessionCookie } from '@/lib/session';

export async function POST() {
  const token = await getSessionTokenFromCookies();
  if (token) {
    try {
      await destroySession(token);
    } catch {
      // 会话可能已过期被清理，忽略
    }
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
