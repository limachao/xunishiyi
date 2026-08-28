'use client';

import * as React from 'react';
import {
  Download,
  RefreshCw,
  Shirt,
  ArrowLeftRight,
  Save,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import Link from 'next/link';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ClothingCategory as CategoryType, TryResult } from '@/types/game';

const CATEGORY_LABELS: Record<CategoryType, { label: string; emoji: string }> = {
  TOP: { label: '上衣', emoji: '👕' },
  BOTTOM: { label: '下装', emoji: '👖' },
  DRESS: { label: '连衣裙', emoji: '👗' },
  UNKNOWN: { label: '服装', emoji: '🧵' },
};

export function Result() {
  const { session, user, dispatch, hasEnoughCredits, consumeCredit } = useGame();
  const result = session.currentTry;
  const error = session.error;
  const [comparisonPct, setComparisonPct] = React.useState(50);
  const [isSaving, setIsSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [imgLoadError, setImgLoadError] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setImgLoadError(false);
  }, [result?.resultImageUrl]);

  const handleSliderMove = (clientX: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setComparisonPct(Math.max(0, Math.min(100, pct)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    handleSliderMove(e.clientX);
  };

  const download = () => {
    if (!result?.resultImageUrl) return;
    const a = document.createElement('a');
    a.href = result.resultImageUrl;
    a.download = `fitmate-try-on-${result.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const tryAnother = () => {
    dispatch({ type: 'TRY_ANOTHER_OUTFIT' });
  };

  const regen = () => {
    if (!hasEnoughCredits(1)) return;
    consumeCredit();
    dispatch({ type: 'GENERATE_START' });
    dispatch({ type: 'GENERATE_PROGRESS', payload: 5 });
  };

  const backToEditClothing = () => {
    dispatch({ type: 'SET_STEP', payload: 'step-clothing' });
  };

  const saveResult = async () => {
    if (!result || !user.isAuthenticated) return;
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      dispatch({
        type: 'HISTORY_ITEM_SAVE',
        payload: {
          id: result.id,
          personImageUrl: result.originalPersonUrl,
          clothingImageUrl: result.originalClothingUrl,
          resultImageUrl: result.resultImageUrl,
          category: result.category,
          generationMs: result.generationMs,
          outputQuality: 'standard',
          createdAt: result.createdAt,
        },
      });
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-0 p-0">
            <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 py-3.5 md:px-5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 icon-red">
                  <ArrowLeftRight className="h-3 w-3" />
                  效果对比
                </Badge>
                <span className="tabular-nums text-[11px] font-medium text-white/50">
                  {Math.round(comparisonPct)}%
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-3 text-[12px]"
                  onClick={() => setComparisonPct(0)}
                >
                  原图
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-3 text-[12px]"
                  onClick={() => setComparisonPct(50)}
                >
                  对半
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-xl px-3 text-[12px]"
                  onClick={() => setComparisonPct(100)}
                >
                  预览
                </Button>
              </div>
            </div>

            <div
              ref={sliderRef}
              className="relative aspect-[4/5] w-full select-none overflow-hidden bg-black/30 touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={(e) => {
                if (e.buttons === 1 || e.pointerType === 'touch') {
                  handleSliderMove(e.clientX);
                }
              }}
            >
              {result && result.status === 'success' && !error ? (
                <>
                  <img
                    src={result.originalPersonUrl}
                    alt="原始照片"
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                    draggable={false}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - comparisonPct}% 0 0)` }}
                  >
                    <img
                      src={result.resultImageUrl}
                      alt="试穿预览"
                      className="absolute inset-0 h-full w-full object-contain"
                      draggable={false}
                      onError={() => setImgLoadError(true)}
                      onLoad={() => setImgLoadError(false)}
                    />
                    {imgLoadError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white/70">
                        图片加载失败，请刷新重试
                      </div>
                    )}
                  </div>
                  <div
                    className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-white/95 shadow-[0_0_14px_rgba(255,255,255,0.3)]"
                    style={{ left: `${comparisonPct}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.08)] ring-0">
                      <ArrowLeftRight className="h-4.5 w-4.5" strokeWidth={2.4} />
                    </div>
                  </div>
                  <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/95 backdrop-blur-xl ring-1 ring-white/10">
                    原图
                  </div>
                  <div
                    className="absolute top-3 rounded-full bg-primary/92 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.18)_inset,0_8px_20px_-8px_oklch(0.62_0.11_195_/_0.8)] backdrop-blur-xl"
                    style={{ right: `calc(${100 - comparisonPct}% + 12px)` }}
                  >
                    试穿效果
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[oklch(0.6_0.24_25_/_0.12)] text-primary shadow-[0_0_0_1px_oklch(0.6_0.24_25_/_0.2)_inset]">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[17px] font-semibold tracking-tight">
                      {error ? '生成过程中出了点小问题' : '预览还在准备中'}
                    </h3>
                    <p className="max-w-md text-[13.5px] leading-relaxed text-white/60">
                      {error ?? '还在生成中，请稍等，完成后会自动显示。'}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/try" onClick={backToEditClothing}>
                        <ArrowLeft className="h-4 w-4" /> 返回改服装
                      </Link>
                    </Button>
                    {error && hasEnoughCredits(1) && (
                      <Button type="button" onClick={regen}>
                        <RefreshCw className="h-4 w-4" /> 重新生成
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-4 py-3 text-[11px] text-white/50 md:px-5">
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                {result && (
                  <>
                    <Badge variant="secondary" className="gap-1.5 icon-red">
                      <Shirt className="h-3 w-3" />
                      {CATEGORY_LABELS[result.category].emoji}{' '}
                      {CATEGORY_LABELS[result.category].label}
                    </Badge>
                    {result.generationMs != null && (
                      <span className="tabular-nums">
                        生成耗时 {Math.max(1, Math.round(result.generationMs / 1000))} 秒
                      </span>
                    )}
                  </>
                )}
              </div>
              <span>预览仅供参考，实际版型、面料可能略有差异</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/15 bg-[oklch(0.62_0.11_195_/_0.04)]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[oklch(0.62_0.11_195_/_0.14)] text-primary shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.22)_inset] icon-red">
                <Shirt className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold tracking-tight">用同一张照片，再试一套别的</h4>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">
                  你刚上传的照片还在会话缓存里，有剩余次数就可以无限换服装。
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="shrink-0"
              onClick={tryAnother}
            >
              <Shirt className="h-4 w-4" />
              再试一套
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-[108px] flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:p-6">
              <h3 className="text-[17px] font-semibold tracking-tight">操作</h3>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="justify-start gap-2"
                  disabled={!result || result.status !== 'success'}
                  onClick={download}
                >
                  <Download className="h-4 w-4" />
                  下载 PNG
                </Button>

                <div className="relative">
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="w-full justify-start gap-2"
                    disabled={!result || !hasEnoughCredits(1) || session.isGenerating}
                    onClick={regen}
                  >
                    <RefreshCw className="h-4 w-4" />
                    重新生成预览
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-0.5 text-[10.5px] font-medium text-white/60 ring-1 ring-white/8">
                      <Lock className="h-2.5 w-2.5 text-primary" />
                      消耗 1 次
                    </span>
                  </Button>
                </div>

                {user.isAuthenticated ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="justify-start gap-2"
                    disabled={!result || isSaving || justSaved}
                    onClick={saveResult}
                  >
                    {justSaved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        已保存到历史记录
                      </>
                    ) : isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        保存中…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 text-primary" />
                        保存到历史记录
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    asChild
                    size="lg"
                    variant="outline"
                    className="justify-start gap-2"
                  >
                    <Link href="/auth">
                      <LogIn className="h-4 w-4 text-primary" />
                      登录后可保存
                    </Link>
                  </Button>
                )}
              </div>

              <div className="space-y-2.5 border-t border-white/8 pt-4">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-white/55">剩余试穿次数</span>
                  <span className="tabular-nums font-semibold">
                    {user?.usage?.remainingCredits ?? 0}{' '}
                    <span className="text-white/45">
                      / {(user?.usage?.totalCredits ?? 0) + (user?.usage?.bonusCredits ?? 0)}
                    </span>
                  </span>
                </div>
                <Progress
                  value={
                    ((user?.usage?.usedCredits ?? 0) /
                      Math.max(
                        1,
                        (user?.usage?.totalCredits ?? 0) +
                          (user?.usage?.bonusCredits ?? 0),
                      )) *
                    100
                  }
                />
                {(user?.usage?.remainingCredits ?? 0) <= 1 && (
                  <p className="pt-0.5 text-[11px] font-medium text-primary">
                    快用完啦，升级套餐可获得无限预览。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-[oklch(0.62_0.11_195_/_0.04)]">
            <CardContent className="flex flex-col gap-2.5 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                小提示
              </p>
              <p className="text-[13.5px] leading-relaxed text-white/75">
                效果满意就下载预览，再去试试其他款。
                如果不是你想要的效果，可以
                <button
                  type="button"
                  className="mx-1 font-semibold text-primary underline-offset-3 hover:underline"
                  onClick={regen}
                >
                  重新生成
                </button>
                试试更清晰的服装图。
              </p>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}
