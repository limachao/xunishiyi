'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader, type ImageSample } from '@/components/ui/image-uploader';
import { QuotaExceededModal } from '@/components/subscription/quota-exceeded-modal';

const PERSON_SAMPLES: ImageSample[] = [
  {
    label: '日常站立照',
    tag: '推荐',
    url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '正面全身照',
    tag: '推荐',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '侧面姿势',
    tag: '可用',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=75',
  },
  {
    label: '日常自拍',
    tag: '可用',
    url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=75',
  },
];

export function StepPerson() {
  const { session, dispatch, hasEnoughCredits } = useGame();
  const [quotaOpen, setQuotaOpen] = React.useState(false);

  const hasImage = Boolean(session.personPhotoUrl);
  const hasQuota = hasEnoughCredits(1);
  const canContinue = hasImage && hasQuota && !session.isGenerating;

  const handlePersonChange = (file: File, url: string) => {
    dispatch({ type: 'SET_PERSON_PHOTO', payload: { file, url } });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_PERSON_PHOTO' });
  };

  const handleContinue = () => {
    if (!hasImage) return;
    if (!hasQuota) {
      setQuotaOpen(true);
      return;
    }
    dispatch({ type: 'SET_STEP', payload: 'step-clothing' });
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <ImageUploader
          label="第 1 步 · 上传你的照片"
          description="上传任意日常照片都可以，你的脸型和身形会完整保留，我们只替换要试穿的衣服。"
          hint="建议：全身照、站立姿势、光线均匀，效果最好。"
          valueFile={session.personPhoto}
          valueUrl={session.personPhotoUrl}
          maxSizeMb={10}
          aspectRatioHint="推荐全身照比例"
          samples={PERSON_SAMPLES}
          error={session.error}
          onFileChange={handlePersonChange}
          onClear={handleClear}
          tips={[
            {
              title: '✅ 拍摄建议（效果最佳）',
              items: [
                '全身照或半身照，站姿自然',
                '光线均匀，避免强烈阴影或过曝',
                '纯色或虚化背景都可以',
              ],
            },
            {
              title: '⚠️ 可以上传，但效果可能略差',
              items: [
                '只拍到上半身的大头自拍',
                '背景杂物多或光线较暗',
                '戴帽子、墨镜，或穿着多件叠穿',
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
                  <h3 className="text-[17px] font-semibold tracking-tight">隐私有保障，放心上传</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">
                    你的照片仅用于本次试穿，不会用于训练 AI。
                  </p>
                </div>
                <Badge variant="success" className="shrink-0">
                  隐私保护
                </Badge>
              </div>
              <ul className="space-y-2 text-[13.5px] text-white/65">
                <li className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  所有图片传输均为加密连接。
                </li>
                <li className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  保存的历史记录你随时可以删除。
                </li>
                <li className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  游客照片会话结束后自动清除。
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-[oklch(0.62_0.11_195_/_0.04)]">
            <CardContent className="flex flex-col gap-3 p-5 md:p-6">
              <h3 className="text-[17px] font-semibold tracking-tight">准备好就继续</h3>
              <p className="text-[13.5px] leading-relaxed text-white/60">
                下一步：上传服装图（上衣、下装或连衣裙），每次试穿 1 件。
              </p>
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link href="/">取消</Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  disabled={!hasImage || session.isGenerating}
                  onClick={handleContinue}
                >
                  继续
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {!hasQuota && (
                <p className="pt-1 text-[11.5px] font-medium text-primary">
                  免费试穿次数已用完，升级套餐即可继续使用。
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
