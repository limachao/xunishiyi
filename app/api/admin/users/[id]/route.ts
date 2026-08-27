import { NextRequest } from 'next/server';
import { requireAdmin, unauthorized, ok, error } from '../../_shared';
import { updateUserStatus } from '@/app/actions/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(req))) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const result = await updateUserStatus(Number(id), body.status);

  if (!result.success) {
    return error(result.error ?? 'Update failed', 400);
  }
  return ok({ success: true });
}