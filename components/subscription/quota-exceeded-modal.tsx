'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Zap,
  Crown,
  CheckCircle2,
  ArrowRight,
  Rocket,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGame } from '@/contexts/GameContext';

export interface QuotaExceededModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

const PLAN_SUMMARY = [
  {
    plan: '进阶版',
    billing: '/月',
    price: '¥68',
    tagline: '每月 100 次预览',
    highlights: ['高清画质', '无水印', '优先生成队列'],
    recommended: false,
    accent: 'bg-[oklch(0.62_0.11_195_/_0.1)] text-primary border border-primary/15',
    slug: 'pro',
  },
  {
    plan: '旗舰版',
    billing: '/月',
    price: '¥198',
    tagline: '无限次预览',
    highlights: ['包含进阶版全部功能', '服装类别精细化', '批量上传', '邮件专属支持'],
    recommended: true,
    accent: 'bg-gradient-to-tr from-primary/18 via-[oklch(0.62_0.11_195_/_0.12)] to-[oklch(0.45_0.1_195_/_0.1)] text-primary border border-primary/20',
    slug: 'premium',
  },
];

export function QuotaExceededModal({ open, onOpenChange, onClose }: QuotaExceededModalProps) {
  const { usage, subscription } = useGame();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="gap-1.5 icon-red">
              <Zap className="h-3 w-3" />
              免费额度已用完
            </Badge>
            {subscription.plan === 'FREE' && (
              <Badge variant="outline" className="gap-1.5 icon-red">
                <Crown className="h-3 w-3" />
                当前套餐：免费版
              </Badge>
            )}
          </div>
          <DialogTitle className="text-[26px] font-bold tracking-tight md:text-[28px]">
            你的 {usage.totalCredits + usage.bonusCredits} 次免费预览已全部用完
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            升级套餐可解锁更高清画质、去水印，以及更多每月试穿次数，随时可取消。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {PLAN_SUMMARY.map((plan) => (
            <div
              key={plan.plan}
              className={
                'relative flex flex-col gap-4 rounded-[1.35rem] p-5 transition-all duration-300 ' +
                (plan.recommended
                  ? 'glass border border-primary/35 bg-gradient-to-br from-[oklch(0.62_0.11_195_/_0.12)] via-[oklch(0.62_0.11_195_/_0.06)] to-transparent shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.18)_inset,0_24px_48px_-16px_oklch(0.62_0.11_195_/_0.35)]'
                  : 'glass border-white/10 bg-white/[0.02]')
              }
            >
              {plan.recommended && (
                <Badge className="absolute right-4 top-4 gap-1" variant="default">
                  <Rocket className="h-3 w-3" />
                  最多人选
                </Badge>
              )}
              <div>
                <p className="text-[13px] font-medium text-white/55">{plan.plan}</p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-[34px] font-bold tracking-tight">{plan.price}</span>
                  <span className="text-[13px] text-white/50">{plan.billing}</span>
                </p>
                <p className="mt-1 text-[13px] text-white/55">{plan.tagline}</p>
              </div>
              <ul className="space-y-2 text-[14px]">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.4} />
                    <span className="text-white/85">{h}</span>
                  </li>
                ))}
              </ul>
              <div className={'mt-auto rounded-[1rem] p-3 ' + plan.accent}>
                <p className="text-[11.5px] font-semibold">
                  {plan.slug === 'pro'
                    ? '适合每周穿搭购物的你'
                    : '重度试衣 / 电商商家性价比首选'}
                </p>
              </div>
              <Button asChild size="lg" variant={plan.recommended ? 'default' : 'secondary'}>
                <Link
                  href={`/pricing?plan=${plan.slug}`}
                  className="justify-between"
                  onClick={() => {
                    onClose?.();
                  }}
                >
                  选择 {plan.plan}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
          <p className="text-[12px] text-white/50">
            想继续免费看看？你可以
            <button
              type="button"
              className="mx-1 font-medium text-white/80 underline underline-offset-2 hover:text-primary transition-colors"
              onClick={() => {
                onClose?.();
                onOpenChange(false);
              }}
            >
              关闭弹窗
            </button>
            去浏览示例效果。
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            稍后再说
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useQuotaExceededModal() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen };
}
