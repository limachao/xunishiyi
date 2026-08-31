import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { setAdminCookie } from '@/lib/admin';
import { verifyTurnstileToken } from '@/lib/turnstile';

/** 时序安全的字符串比对，防止通过响应时间猜测密码 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  let body: { password?: unknown; turnstileToken?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const adminSecret = process.env.ADMIN_SECRET ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  if (!adminSecret || !adminPassword) {
    console.error(
      '[AdminLogin] ADMIN_SECRET / ADMIN_PASSWORD 未配置，管理后台已锁死。',
    );
    return NextResponse.json(
      { ok: false, message: '后台未启用：请先在环境变量中配置 ADMIN_PASSWORD 和 ADMIN_SECRET。' },
      { status: 503 },
    );
  }

  const ts = await verifyTurnstileToken(body.turnstileToken, 'admin-login');
  if (!ts.ok) {
    return NextResponse.json(
      { ok: false, message: ts.message ?? '人机验证未通过，请刷新页面重试。' },
      { status: 403 },
    );
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || !safeEqual(password, adminPassword)) {
    return NextResponse.json(
      { ok: false, message: '管理密码错误。' },
      { status: 401 },
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
