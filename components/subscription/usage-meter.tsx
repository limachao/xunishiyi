'use client';

import * as React from 'react';
import { Zap } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import type { UsageInfo as UsageInfoType } from '@/types/game';

export interface UsageMeterProps {
  className?: string;
}

function computeUsage(u: UsageInfoType | undefined | null) {
  if (!u) return { total: 0, used: 0, remaining: 0, pct: 0 };
  const total = Math.max(1, u.totalCredits + u.bonusCredits);
  const used = Math.min(total, Math.max(0, u.usedCredits));
  return { total, used, remaining: total - used, pct: Math.round((used / total) * 100) };
}

function planLabel(plan?: string | null): string {
  if (!plan) return '免费版';
  switch (plan) {
    case 'FREE':
      return '免费版';
    case 'PRO':
      return '进阶版';
    case 'PREMIUM':
      return '旗舰版';
    default:
      return plan.replace(/_/g, ' ').toLowerCase();
  }
}

export function UsageMeter({ className }: UsageMeterProps) {
  const { user, usage } = useGame();
  const info = React.useMemo(() => computeUsage(usage ?? user?.usage), [user?.usage, usage]);

  const nearLimit = info.pct >= 80;
  const depleted = info.remaining <= 0;
  const label = planLabel(user?.subscription?.plan);

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-2.5 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl sm:min-w-[210px] sm:max-w-[260px]',
        depleted && 'border-[oklch(0.6_0.24_25_/_0.35)] bg-[oklch(0.6_0.24_25_/_0.07)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.85rem] icon-red',
          depleted
            ? 'bg-[oklch(0.6_0.24_25_/_0.14)] shadow-[0_0_0_1px_oklch(0.6_0.24_25_/_0.25)_inset]'
            : nearLimit
              ? 'bg-amber-500/14 shadow-[0_0_0_1px_oklch(0.75_0.18_85_/_0.28)_inset]'
              : 'bg-[oklch(0.62_0.11_195_/_0.12)] shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.24)_inset]',
        )}
        aria-hidden
      >
        <Zap className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-medium text-white/60">
            {label}
          </span>
          <span className="shrink-0 tabular-nums text-[11px] font-semibold">
            <span className={cn(depleted && 'text-primary')}>
              {info.remaining}
            </span>
            <span className="text-white/45"> / {info.total} 次</span>
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              depleted
                ? 'bg-gradient-to-r from-[oklch(0.58_0.1_195)] to-[oklch(0.64_0.1_190)] shadow-[0_0_10px_oklch(0.6_0.24_25_/_0.5)]'
                : nearLimit
                  ? 'bg-gradient-to-r from-[oklch(0.75_0.18_85)] to-[oklch(0.7_0.16_60)] shadow-[0_0_10px_oklch(0.75_0.18_85_/_0.45)]'
                  : 'bg-gradient-to-r from-[oklch(0.58_0.1_195)] via-[oklch(0.68_0.11_195)] to-[oklch(0.5_0.1_190)] shadow-[0_0_10px_oklch(0.68_0.11_195_/_0.45)]',
            )}
            style={{ width: `${info.pct}%` }}
            role="progressbar"
            aria-label="试穿额度使用进度"
            aria-valuenow={info.pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  );
}
