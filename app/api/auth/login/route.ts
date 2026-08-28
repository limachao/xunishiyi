import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/session';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown; turnstileToken?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: '请求格式错误。' }, { status: 400 });
  }

  const ts = await verifyTurnstileToken(body.turnstileToken, 'login');
  if (!ts.ok) {
    return NextResponse.json(
      { ok: false, message: ts.message ?? '人机验证未通过，请刷新页面重试。' },
      { status: 403 },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: '请输入邮箱和密码。' }, { status: 400 });
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      hashedPassword: users.hashedPassword,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user?.hashedPassword || !verifyPassword(password, user.hashedPassword)) {
    return NextResponse.json({ ok: false, message: '邮箱或密码错误。' }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, image: user.image },
  });
  setSessionCookie(response, token);
  return response;
}
