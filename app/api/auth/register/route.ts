import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, usageInfos, subscriptions } from '@/lib/db/schema';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/session';
import { verifyTurnstileToken } from '@/lib/turnstile';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: unknown; name?: unknown; password?: unknown; turnstileToken?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: '请求格式错误。' }, { status: 400 });
  }

  const ts = await verifyTurnstileToken(body.turnstileToken, 'register');
  if (!ts.ok) {
    return NextResponse.json(
      { ok: false, message: ts.message ?? '人机验证未通过，请刷新页面重试。' },
      { status: 403 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email) || email.length > 255) {
    return NextResponse.json({ ok: false, message: '邮箱格式不正确。' }, { status: 400 });
  }
  if (password.length < 6 || password.length > 100) {
    return NextResponse.json({ ok: false, message: '密码至少 6 位。' }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ ok: false, message: '昵称过长。' }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ ok: false, message: '该邮箱已注册，请直接登录。' }, { status: 409 });
  }

  const [user] = await db
    .insert(users)
    .values({
      email,
      name: name || null,
      hashedPassword: hashPassword(password),
    })
    .returning({ id: users.id, email: users.email, name: users.name, image: users.image });

  // 初始化免费额度（5 次）与免费订阅
  await db.insert(usageInfos).values({ userId: user.id });
  await db.insert(subscriptions).values({ userId: user.id });

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({ ok: true, user });
  setSessionCookie(response, token);
  return response;
}
