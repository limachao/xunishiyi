import { NextRequest } from 'next/server';
import { isAdminOnServer } from '@/lib/admin';

export async function requireAdmin(req: NextRequest): Promise<boolean> {
  return await isAdminOnServer();
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function ok<T>(data: T) {
  return Response.json({ data });
}

export function error(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}