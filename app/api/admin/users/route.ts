import { NextRequest } from 'next/server';
import { requireAdmin, unauthorized, ok } from '../_shared';
import { getAdminUsers } from '@/app/actions/admin';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') || undefined;

  const users = await getAdminUsers({ page, pageSize, search, status });
  return ok(users);
}