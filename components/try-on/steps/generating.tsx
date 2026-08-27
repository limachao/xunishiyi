'use client';

import * as React from 'react';
import {
  Shirt,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useTransition } from 'react';
import { useGame } from '@/contexts/GameContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { generateTryOn } from '@/app/actions/try-on';
import type { ActionError } from '@/lib/try-on-types';
import type { ClothingCategory as CategoryType } from '@/types/game';
import { QuotaExceededModal } from '@/components/subscription/quota-exceeded-modal';
import { userMessageForCode } from '@/lib/validators';

const CATEGORY_META: Record<
  Exclude<CategoryType, 'UNKNOWN'>,
  { label: string; emoji: string; variant: 'success' | 'default' | 'warning' }
> = {
  TOP: { label: '上衣', emoji: '👕', variant: 'success' },
  BOTTOM: { label: '下装', emoji: '👖', variant: 'warning' },
  DRESS: { label: '连衣裙', emoji: '👗', variant: 'default' },
};

const PROGRESS_STAGES: { threshold: number; text: string }[] = [
  { threshold: 10, text: '正在上传图片…' },
  { threshold: 30, text: '识别服装类别…' },
  { threshold: 55, text: '把服装对齐到你的身形…' },
  { threshold: 80, text: '优化版型和颜色过渡…' },
  { threshold: 100, text: '正在生成最终预览…' },
];

export function Generating() {
  const {
    session,
    usage,
    dispatch,
    consumeCredit,
    refundCredit,
  } = useGame();
  const {
    generatingProgress,
    detectedCategory,
    personPhotoUrl,
    clothingPhotoUrl,
    personPhoto,
    clothingPhoto,
    error: existingError,
  } = session;

  const [isPending, startTransition] = useTransition();
  const triggeredRef = React.useRef(false);
  const [quotaOpen, setQuotaOpen] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!session.isGenerating) return;
    if (triggeredRef.current) return;
    if (!personPhotoUrl || !clothingPhotoUrl) return;

    triggeredRef.current = true;
    const needCredits = 1;

    if (usage.remainingCredits < needCredits) {
      dispatch({
        type: 'GENERATE_FAIL',
        payload: { error: userMessageForCode('INSUFFICIENT_CREDITS') },
      });
      setQuotaOpen(true);
      triggeredRef.current = false;
      return;
    }

    const localProgress = { value: 2 };
    const tick = () => {
      if (localProgress.value >= 92) return;
      localProgress.value = Math.min(
        92,
        localProgress.value + 1 + Math.random() * 2.5,
      );
      dispatch({
        type: 'GENERATE_PROGRESS',
        payload: Math.round(localProgress.value),
      });
      timerId = window.setTimeout(tick, 320 + Math.random() * 280);
    };
    let timerId = window.setTimeout(tick, 250);
    dispatch({ type: 'GENERATE_PROGRESS', payload: 3 });

    const preDeduct = consumeCredit();

    (async () => {
      try {
        const payload = {
          personImageDataUrl: personPhotoUrl,
          clothingImageDataUrl: clothingPhotoUrl,
          personFilename: personPhoto?.name,
          clothingFilename: clothingPhoto?.name,
          creditsRequired: needCredits,
          clientRemainingCredits: usage.remainingCredits,
        };
        console.debug('[Generating] calling generateTryOn:', {
          personStartsWith: payload.personImageDataUrl.slice(0, 16),
          clothingStartsWith: payload.clothingImageDataUrl.slice(0, 16),
          personBytes: Math.round(((payload.personImageDataUrl.length - 30) * 3) / 4),
          clothingBytes: Math.round(((payload.clothingImageDataUrl.length - 30) * 3) / 4),
        });
        const res = await generateTryOn(payload);
        window.clearTimeout(timerId);
        console.debug('[Generating] generateTryOn returned:', {
          ok: res.ok,
          code: res.ok ? undefined : (res as ActionError).code,
          message: res.ok ? undefined : (res as ActionError).message,
          resultUrl: res.ok ? res.data.result.resultImageUrl.slice(0, 64) + '…' : undefined,
        });
        startTransition(() => {
          if (!res.ok) {
            handleFailure(res, preDeduct.remaining >= needCredits);
            dispatch({ type: 'GENERATE_PROGRESS', payload: 100 });
            return;
          }
          dispatch({ type: 'GENERATE_PROGRESS', payload: 97 });
          dispatch({ type: 'CATEGORY_DETECTED', payload: res.data.category });
          dispatch({
            type: 'GENERATE_SUCCESS',
            payload: {
              category: res.data.category,
              result: res.data.result,
            },
          });
        });
      } catch (e) {
        window.clearTimeout(timerId);
        console.error('[Generating] generateTryOn THREW exception:', e);
        if (e instanceof Error) {
          console.error('[Generating]   name=', e.name, 'message=', e.message);
          console.error('[Generating]   stack=', e.stack);
        }
        startTransition(() => {
          handleFailure(
            {
              ok: false,
              code: 'UNKNOWN',
              message: userMessageForCode('UNKNOWN'),
              retryable: true,
            },
            true,
          );
          dispatch({ type: 'GENERATE_PROGRESS', payload: 100 });
        });
      } finally {
        triggeredRef.current = false;
      }
    })();

    return () => {
      window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isGenerating, personPhotoUrl, clothingPhotoUrl]);

  const handleFailure = (err: ActionError, refund: boolean) => {
    if (refund) refundCredit();
    if (err.code === 'INSUFFICIENT_CREDITS') setQuotaOpen(true);
    const msg = err.message || userMessageForCode(err.code);
    setLocalError(msg);
    dispatch({ type: 'GENERATE_FAIL', payload: { error: msg } });
  };

  const handleCancel = () => {
    dispatch({ type: 'SET_STEP', payload: 'step-clothing' });
  };

  const displayError = existingError ?? localError;

  const statusText = React.useMemo(() => {
    if (displayError) return '生成遇到问题，请稍后重试';
    const pct = generatingProgress;
    const match = PROGRESS_STAGES.find((s) => pct < s.threshold);
    return match ? match.text : PROGRESS_STAGES[PROGRESS_STAGES.length - 1].text;
  }, [generatingProgress, displayError]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 py-6 text-center">
      <Card className="w-full overflow-hidden">
        <CardContent className="flex flex-col items-center gap-7 p-6 md:p-10">
          <div className="relative flex h-24 w-24 items-center justify-center md:h-28 md:w-28">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-[oklch(0.45_0.1_195)] to-primary opacity-35 blur-2xl animate-pulse"
              aria-hidden
            />
            <div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/25 to-[oklch(0.45_0.1_195_/_0.15)] opacity-60 blur-lg"
              aria-hidden
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[oklch(0.62_0.11_195_/_0.2)] via-[oklch(0.62_0.11_195_/_0.08)] to-[oklch(0.45_0.1_195_/_0.15)] ring-1 ring-primary/25 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_24px_48px_-16px_oklch(0.62_0.11_195_/_0.45)] md:h-28 md:w-28">
              {displayError ? (
                <AlertTriangle className="h-10 w-10 text-primary md:h-12 md:w-12" />
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-primary md:h-12 md:w-12" strokeWidth={2.2} />
              )}
            </div>
            <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-primary animate-pulse" />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-[22px] font-bold tracking-tight md:text-[28px]">
              {displayError ? '生成遇到问题' : '正在为你生成试穿预览'}
            </h2>
            <p className="max-w-xl text-[14.5px] leading-relaxed text-white/60 md:text-base">{statusText}</p>
          </div>

          <div className="w-full max-w-md space-y-2.5">
            <Progress value={generatingProgress} aria-label="生成进度" />
            <div className="flex items-center justify-between text-[11px] tabular-nums text-white/50">
              <span>
                {isPending && Math.min(100, generatingProgress) < 10
                  ? '上传中…'
                  : `${Math.min(100, generatingProgress)}%`}
              </span>
              <span>预计总耗时 10–25 秒</span>
            </div>
          </div>

          <div className="min-h-[32px]">
            {detectedCategory && detectedCategory !== 'UNKNOWN' ? (
              <Badge variant={CATEGORY_META[detectedCategory].variant} className="gap-1.5 px-3.5 py-1.5 text-[12px] icon-red">
                <Shirt className="h-3.5 w-3.5" />
                已识别：{CATEGORY_META[detectedCategory].emoji}{' '}
                {CATEGORY_META[detectedCategory].label}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 px-3.5 py-1.5 text-[12px] text-white/55">
                <Loader2 className="h-3 w-3 animate-spin" />
                正在识别服装类型…
              </Badge>
            )}
          </div>

          {(personPhotoUrl || clothingPhotoUrl) && (
            <div className="grid w-full max-w-md grid-cols-2 gap-3 text-left">
              {personPhotoUrl && (
                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    你的照片
                  </p>
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.03]">
                    <img
                      src={personPhotoUrl}
                      alt="你上传的照片"
                      className="h-full w-full object-cover opacity-75 blur-[1.5px]"
                      draggable={false}
                    />
                  </div>
                </div>
              )}
              {clothingPhotoUrl && (
                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    试穿服装
                  </p>
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-[1.1rem] border border-white/8 bg-white/[0.03]">
                    <img
                      src={clothingPhotoUrl}
                      alt="服装预览"
                      className="h-full w-full object-cover opacity-75 blur-[1.5px]"
                      draggable={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-1.5 pt-1">
            <p className="max-w-md text-[11px] leading-relaxed text-white/45">
              生成结果仅作参考，实际版型、垂感、面料细节可能与预览略有差异。
            </p>
            <Button variant="ghost" size="sm" asChild className="text-white/55 hover:text-white/80">
              <Link href="/try" onClick={handleCancel}>
                取消并返回上一步
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuotaExceededModal open={quotaOpen} onOpenChange={setQuotaOpen} />
    </div>
  );
}
