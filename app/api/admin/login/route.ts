import { NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/admin';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(req: Request) {
  let turnstileToken: unknown;
  try {
    const body = (await req.json()) as { turnstileToken?: unknown };
    turnstileToken = body?.turnstileToken;
  } catch {
    // 无 body 或 JSON 解析失败：turnstileToken 保持 undefined
  }

  const ts = await verifyTurnstileToken(turnstileToken, 'admin-login');
  if (!ts.ok) {
    return NextResponse.json(
      { ok: false, message: ts.message ?? '人机验证未通过，请刷新页面重试。' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true, message: 'Admin cookie set' });
  setAdminCookie(response);
  return response;
}

// 旧的 GET 登录入口已废弃：任何人访问 URL 即可拿 cookie，必须走 POST + Turnstile
export async function GET() {
  return NextResponse.json(
    { ok: false, message: '请通过 /admin/login 页面登录。' },
    { status: 405 },
  );
}
