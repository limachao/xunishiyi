'use client';

import * as React from 'react';
import { Check, Lock } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import type { TryStep } from '@/types/game';

const STEPS: { key: TryStep; label: string }[] = [
  { key: 'step-person', label: '上传照片' },
  { key: 'step-clothing', label: '上传服装' },
  { key: 'generating', label: '生成中' },
  { key: 'result', label: '试穿结果' },
];

export interface StepIndicatorProps {
  className?: string;
}

const STEP_ORDER: TryStep[] = [
  'landing',
  'step-person',
  'step-clothing',
  'generating',
  'result',
];

export function StepIndicator({ className }: StepIndicatorProps) {
  const { state } = useGame();
  const session = state.session;
  const currentIndex = Math.max(1, STEP_ORDER.indexOf(session.step));

  return (
    <ol
      className={cn(
        'glass flex w-full items-center justify-between gap-1.5 rounded-[1.25rem] border-white/10 p-1.5 backdrop-blur-2xl md:gap-2 md:p-2',
        className,
      )}
      aria-label="试衣进度"
    >
      {STEPS.map((step, i) => {
        const stepNumber = i + 1;
        const status =
          stepNumber < currentIndex
            ? 'done'
            : stepNumber === currentIndex
              ? 'active'
              : 'pending';
        return (
          <li key={step.key} className="flex flex-1 items-center">
            <div
              className={cn(
                'group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-[0.9rem] px-2 py-2 transition-all duration-300 ease-out sm:px-3 sm:py-2.5',
                status === 'active' &&
                  'bg-gradient-to-br from-[oklch(0.62_0.11_195_/_0.22)] via-[oklch(0.62_0.11_195_/_0.16)] to-[oklch(0.62_0.11_195_/_0.08)] text-primary shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.28)_inset,0_8px_24px_-12px_oklch(0.62_0.11_195_/_0.55)]',
                status === 'done' &&
                  'text-primary/85 bg-white/[0.04]',
                status === 'pending' &&
                  'text-white/40 bg-transparent',
              )}
              aria-current={status === 'active' ? 'step' : undefined}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-300 sm:h-7.5 sm:w-7.5',
                  status === 'done' &&
                    'bg-primary/90 text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset]',
                  status === 'active' &&
                    'bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.18)_inset,0_6px_16px_-6px_oklch(0.62_0.11_195_/_0.8)]',
                  status === 'pending' &&
                    'border border-white/10 bg-white/[0.03] text-white/45',
                )}
              >
                {status === 'done' ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                ) : status === 'pending' ? (
                  <Lock className="h-2.5 w-2.5" />
                ) : (
                  stepNumber
                )}
              </div>
              <span
                className={cn(
                  'hidden truncate text-[12px] font-medium tracking-tight sm:inline-flex',
                  status === 'active' && 'font-semibold',
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 ? (
              <div
                className={cn(
                  'mx-0.5 h-0.5 flex-1 rounded-full sm:mx-1',
                  stepNumber < currentIndex
                    ? 'bg-gradient-to-r from-primary to-primary/50'
                    : 'bg-white/[0.06]',
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
