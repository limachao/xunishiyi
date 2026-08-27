'use client';

import * as React from 'react';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, Shirt, UserRoundPen } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader, type ImageSample } from '@/components/ui/image-uploader';
import { QuotaExceededModal } from '@/components/subscription/quota-exceeded-modal';

const CLOTHING_SAMPLES: ImageSample[] = [
  {
    label: '白 T 恤',
    tag: '上衣',
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '牛仔外套',
    tag: '上衣',
    url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '蓝色牛仔裤',
    tag: '下装',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '夏季连衣裙',
    tag: '连衣裙',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=75',
  },
];

export function StepClothing() {
  const { session, dispatch, hasEnoughCredits } = useGame();
  const [quotaOpen, setQuotaOpen] = React.useState(false);

  const hasPerson = Boolean(session.personPhotoUrl);
  const hasClothing = Boolean(session.clothingPhotoUrl);
  const hasQuota = hasEnoughCredits(1);
  const canGenerate =
    hasPerson && hasClothing && hasQuota && !session.isGenerating;

  const handleChangePerson = () => {
    dispatch({ type: 'SET_STEP', payload: 'step-person' });
  };

  const handleClothingChange = (file: File, url: string) => {
    dispatch({ type: 'SET_CLOTHING_PHOTO', payload: { file, url } });
  };

  const handleClothingClear = () => {
    dispatch({ type: 'CLEAR_CLOTHING_PHOTO' });
  };

  const handleGenerate = () => {
    if (!hasPerson || !hasClothing) return;
    if (!hasQuota) {
      setQuotaOpen(true);
      return;
    }
    dispatch({ type: 'GENERATE_START' });
    dispatch({ type: 'GENERATE_PROGRESS', payload: 3 });
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        {session.personPhotoUrl && (
          <Card className="border-primary/18 bg-[oklch(0.62_0.11_195_/_0.05)]">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-4.5">
              <div className="flex items-center gap-3.5">
                <div className="relative h-[72px] w-[56px] shrink-0 overflow-hidden rounded-[0.9rem] border border-white/10 bg-white/[0.04]">
                  <Image
                    src={session.personPhotoUrl}
                    alt="你上传的照片"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserRoundPen className="h-3.5 w-3.5 text-primary" />
                    <p className="text-[14px] font-semibold tracking-tight">你的照片 — 已准备好</p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-white/55">
                    本会话可反复用这张照片试不同服装。
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleChangePerson}
                className="icon-red"
              >
                换一张
              </Button>
            </CardContent>
          </Card>
        )}

        <ImageUploader
          label="第 2 步 · 上传服装图片"
          description="每次试穿一件，商品图、商品详情页截图、平铺图都可以用。"
          hint="V1 支持：上衣 · 下装 · 连衣裙（一次一件）。"
          valueFile={session.clothingPhoto}
          valueUrl={session.clothingPhotoUrl}
          maxSizeMb={10}
          samples={CLOTHING_SAMPLES}
          error={session.error}
          onFileChange={handleClothingChange}
          onClear={handleClothingClear}
          tips={[
            {
              title: '👕 支持的服装类别',
              items: [
                '上衣：T 恤、衬衫、卫衣、夹克、毛衣、雪纺衫',
                '下装：牛仔裤、休闲裤、短裤、半身裙',
                '连衣裙：任意长度、任意风格',
              ],
            },
            {
              title: '📌 V1 限制说明（一次一件）',
              items: [
                '暂不支持整套（上衣+下装）同时试穿',
                '鞋、包、配饰会被忽略',
                '每次生成完点击「再试一套」即可更换服装',
              ],
            },
          ]}
        />
      </div>

      <aside className="lg:col-span-2">
        <div className="sticky top-[108px] flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[17px] font-semibold tracking-tight">接下来会发生什么</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">
                    大概 10–20 秒，试穿效果就准备好了。
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1 icon-red">
                  <Shirt className="h-3 w-3" /> 一次一件
                </Badge>
              </div>
              <ol className="space-y-2.5 text-[13.5px]">
                {[
                  'AI 自动识别服装类别（上衣/下装/连衣裙）',
                  '服装对齐到你的身体比例和姿势',
                  '你的面部、姿势、背景完整保留',
                  '生成真实自然的试穿预览',
                ].map((item, i) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[oklch(0.62_0.11_195_/_0.14)] text-[10px] font-bold text-primary shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.22)_inset]">
                      {i + 1}
                    </span>
                    <span className="text-white/85">{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-[oklch(0.62_0.11_195_/_0.04)]">
            <CardContent className="flex flex-col gap-3 p-5 md:p-6">
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  type="button"
                  onClick={handleChangePerson}
                >
                  <ArrowLeft className="h-4 w-4" />
                  上一步
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  disabled={!hasPerson || !hasClothing || session.isGenerating}
                  onClick={handleGenerate}
                >
                  生成试穿效果
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {!hasPerson && (
                <p className="pt-1 text-[11.5px] font-medium text-primary">
                  请先上传你的照片。
                </p>
              )}
              {hasPerson && !hasQuota && (
                <p className="pt-1 text-[11.5px] font-medium text-primary">
                  剩余试穿次数不足，升级套餐后可继续使用。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </aside>
      <QuotaExceededModal open={quotaOpen} onOpenChange={setQuotaOpen} />
    </div>
  );
}
