import { NextRequest } from 'next/server';
import { requireAdmin, unauthorized, ok } from '../_shared';
import { getDashboardStats } from '@/app/actions/admin';

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  const stats = await getDashboardStats();
  return ok(stats);
}