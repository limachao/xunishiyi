import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';

const SESSION_COOKIE_NAME = 'user_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

// ============================================================
// 密码哈希（scrypt，Node 内置，无额外依赖）
// 存储格式: salt:hash （均为 hex）
// ============================================================

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ============================================================
// 会话管理（sessions 表 + HttpOnly Cookie）
// ============================================================

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
}

/** 为用户创建一条会话记录并返回 token（不写 Cookie，Cookie 由路由层负责） */
export async function createSessionToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await db.insert(sessions).values({
    sessionToken: token,
    userId,
    expires: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

/** 从 Cookie 读会话，返回当前登录用户；未登录/过期返回 null */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.sessionToken, token), gt(sessions.expires, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

/** 删除指定 token 的会话（退出登录用） */
export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.sessionToken, token));
}

/** 供 logout 路由读取当前 Cookie 中的 token */
export async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
