import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { subscriptions, usageInfos } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: true, user: null });
  }

  // 附带订阅与额度信息，供客户端全局状态初始化
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);
  const [usage] = await db
    .select()
    .from(usageInfos)
    .where(eq(usageInfos.userId, user.id))
    .limit(1);

  return NextResponse.json({
    ok: true,
    user,
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          stripeCustomerId: sub.stripeCustomerId,
        }
      : null,
    usage: usage
      ? {
          totalCredits: usage.totalCredits,
          usedCredits: usage.usedCredits,
          bonusCredits: usage.bonusCredits,
          remainingCredits: Math.max(
            0,
            usage.totalCredits + usage.bonusCredits - usage.usedCredits,
          ),
          lastResetAt: usage.lastResetAt?.toISOString() ?? null,
        }
      : null,
  });
}
