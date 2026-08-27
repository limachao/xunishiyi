import { NextResponse } from 'next/server';
import { setAdminCookie } from '@/lib/admin';

export async function GET() {
  const response = NextResponse.json({ ok: true, message: 'Admin cookie set' });
  setAdminCookie(response);
  return response;
}
