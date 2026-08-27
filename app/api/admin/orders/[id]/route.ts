import { NextRequest } from 'next/server';
import { requireAdmin, unauthorized, ok, error } from '../../_shared';
import { getOrderDetail, updateOrderStatus } from '@/app/actions/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) return unauthorized();

  const { id } = await params;
  const detail = await getOrderDetail(Number(id));
  if (!detail) return error('Not found', 404);
  return ok(detail);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const result = await updateOrderStatus(Number(id), body.status);

  if (!result.success) {
    return error(result.error ?? 'Update failed', 400);
  }
  return ok({ success: true });
}