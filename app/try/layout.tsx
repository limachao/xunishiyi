import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/try-on/step-indicator';
import { UsageMeter } from '@/components/subscription/usage-meter';
import {
  AuthGateProvider,
  type AuthGateState,
} from '@/components/auth/auth-gate-provider';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { subscriptions, usageInfos } from '@/lib/db/schema';

export const metadata: Metadata = {
  title: '虚拟试衣',
  description:
    '上传你的照片和服装图，生成真实的试穿效果预览，先试后买更放心。',
};

export default async function TryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 注入登录态：未登录可以浏览上传界面，点击上传时才弹出登录窗
  const user = await getCurrentUser();

  let authState: AuthGateState | null = null;
  if (user) {
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

    authState = {
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
    };
  }

  return (
    <AuthGateProvider authState={authState}>
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 md:px-8 md:py-8">
      <header className="glass sticky top-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border-white/10 px-4 py-3 backdrop-blur-2xl md:px-5 md:py-3.5">
        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
          </Button>
          <div className="h-5 w-px bg-white/10" aria-hidden />
          <h1 className="text-[15px] font-semibold tracking-tight md:text-base">
            AI 虚拟试衣
          </h1>
        </div>
        <UsageMeter />
      </header>

      <div className="w-full">
        <StepIndicator className="px-1" />
      </div>

      <div className="flex-1 pb-6">{children}</div>

      <footer className="text-center text-[11px] text-white/45">
        预览仅供参考，实际版型、面料、垂感和细节可能略有差异。
      </footer>
    </main>
    </AuthGateProvider>
  );
}
