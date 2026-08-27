'use client';

import { Box, Lock, Search, Settings, Sparkles, Zap } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

const settings = {
  blur: 0,
  spread: 40,
  proximity: 64,
  inactiveZone: 0.01,
  borderWidth: 3,
};

interface FeatureGridProps {
  className?: string;
}

export function FeatureGrid({ className }: FeatureGridProps) {
  return (
    <div className={className ?? ''}>
      <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:grid-rows-2 h-full">
        <GridItem
          settings={settings}
          area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
          icon={<Zap className="h-4 w-4" />}
          title="极速生成"
          description="10-20 秒即可生成真实试穿效果，无需排队等待，即刻看到上身效果。"
        />
        <GridItem
          settings={settings}
          area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
          icon={<Settings className="h-4 w-4" />}
          title="精准还原"
          description="AI 保留你的身材与五官，只替换服装，颜色、版型、纹理精准匹配。"
        />
        <GridItem
          settings={settings}
          area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
          icon={<Lock className="h-4 w-4" />}
          title="隐私安全"
          description="照片仅用于本次生成，不存储不上传公开，试完即走。"
        />
        <GridItem
          settings={settings}
          area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
          icon={<Sparkles className="h-4 w-4" />}
          title="全品类支持"
          description="上衣、下装、连衣裙均可识别，电商截图、平铺图都能用。"
        />
        <GridItem
          settings={settings}
          area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
          icon={<Box className="h-4 w-4" />}
          title="每天免费 5 次"
          description="注册即享每日 5 次免费额度，够用一整周的穿搭灵感。"
        />
      </ul>
    </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  settings: typeof settings;
}

const GridItem = ({
  area,
  icon,
  title,
  description,
  settings,
}: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-white/10 p-2 md:rounded-3xl md:p-3 bg-white/[0.02]">
        <GlowingEffect
          blur={settings.blur}
          spread={settings.spread}
          proximity={settings.proximity}
          inactiveZone={settings.inactiveZone}
          borderWidth={settings.borderWidth}
          glow={true}
          disabled={false}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border border-white/8 p-6 md:p-6 bg-[oklch(0.14_0.008_155_/_0.7)] backdrop-blur-xl">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-white/10 bg-[oklch(0.62_0.11_195_/_0.12)] p-2 text-[oklch(0.68_0.11_195)]">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <p className="font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
