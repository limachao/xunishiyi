import Link from 'next/link';
import { ArrowRight, Sparkles, Shirt, User, Camera, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureGrid } from '@/components/ui/feature-grid';
import { TeamSectionBlock } from '@/components/ui/team-section-block-shadcnui';
import { UserNav } from '@/components/auth/user-nav';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary shadow-[0_0_0_1px_rgba(255,255,255,0.16)_inset,0_12px_28px_-8px_oklch(0.62_0.11_195_/_0.85)]">
              <Shirt className="h-4.5 w-4.5 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">FitMate</span>
          </Link>
          <div className="hidden items-center gap-6 text-[14px] text-muted-foreground md:flex">
            <Link href="/try" className="transition hover:text-foreground">试衣间</Link>
            <Link href="#how-it-works" className="transition hover:text-foreground">使用方法</Link>
          </div>
          <div className="flex items-center gap-1.5">
            <UserNav />
            <Button asChild size="sm" className="h-9 rounded-xl px-4">
              <Link href="/try">
                立即试穿
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative flex flex-col items-center justify-center gap-10 px-6 pb-20 pt-20 text-center md:pt-28 md:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[oklch(0.62_0.11_195_/_0.18)] blur-[120px]" />
        </div>

        <div className="flex flex-col items-center gap-5">
          <Badge variant="secondary" className="gap-1.5 px-4 py-1.5 text-[12px]">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI 驱动 · 每天免费试穿 5 次
          </Badge>

          <h1 className="max-w-4xl text-balance text-[44px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[80px]">
            晴天专属
            <br className="md:hidden" />
            <span className="mx-0.5 md:mx-2.5 inline-block bg-gradient-to-r from-[oklch(0.68_0.11_195)] via-[oklch(0.64_0.1_190)] to-[oklch(0.62_0.11_200)] bg-clip-text text-transparent drop-shadow-[0_0_40px_oklch(0.62_0.11_195_/_0.35)]">
              试衣网站
            </span>
          </h1>

          <p className="max-w-2xl text-pretty text-[17px] leading-relaxed text-white/70 md:text-[21px]">
            上传一张你的生活照 + 任意服装商品图，
            <span className="text-white">10–20 秒</span>
            生成真实可信的上身效果。
            <br className="hidden md:block" />
            上衣、下装、连衣裙全支持，不用刻意摆姿势，也不用白背景。
          </p>

          <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="group h-14 rounded-[1.35rem] px-9 text-[16px]">
              <Link href="/try">
                开始免费试穿
                <ArrowRight className="ml-1 h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="h-14 rounded-[1.35rem] px-9 text-[16px]">
              <Link href="#how-it-works">了解使用方法</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 w-full max-w-5xl">
          <div className="glass relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-[2rem] p-3">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/8 bg-gradient-to-br from-[oklch(0.22_0.02_155_/_0.8)] via-[oklch(0.2_0.015_155_/_0.6)] to-[oklch(0.18_0.02_20_/_0.8)]">
              <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_20%_20%,_oklch(0.62_0.11_195_/_0.25),_transparent_60%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(500px_300px_at_85%_80%,_oklch(0.42_0.09_155_/_0.28),_transparent_60%)]" />
              <div className="relative grid h-full grid-cols-3 gap-3 p-5 md:p-7">
                {/* 输入区：你的照片 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                    <User className="h-3 w-3" /> 你的照片
                  </div>
                  <div className="relative flex-1 overflow-hidden rounded-[1.1rem] border border-white/10 bg-gradient-to-b from-[oklch(0.32_0.04_40_/_0.6)] via-[oklch(0.26_0.03_30_/_0.5)] to-[oklch(0.16_0.01_20_/_0.7)]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_oklch(0.5_0.06_40_/_0.3),_transparent_70%)]" />
                    <svg viewBox="0 0 100 155" className="absolute inset-0 m-auto h-[85%] w-auto" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="skinA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.78 0.05 50)" />
                          <stop offset="100%" stopColor="oklch(0.68 0.06 45)" />
                        </linearGradient>
                        <linearGradient id="bodyA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.52 0.02 30)" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="oklch(0.4 0.02 30)" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="20" r="13" fill="url(#skinA)" />
                      <path d="M33 38 Q50 32 67 38 L70 95 Q50 103 30 95 Z" fill="url(#bodyA)" />
                      <path d="M33 38 L24 44 L22 82 L30 88 L33 60 Z" fill="url(#bodyA)" opacity="0.75" />
                      <path d="M67 38 L76 44 L78 82 L70 88 L67 60 Z" fill="url(#bodyA)" opacity="0.75" />
                      <rect x="40" y="95" width="9" height="40" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                      <rect x="51" y="95" width="9" height="40" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                    </svg>
                  </div>
                </div>

                {/* 中间：AI 处理 */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[oklch(0.62_0.11_195_/_0.16)] text-white border border-white/15 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_12px_32px_-10px_oklch(0.62_0.11_195_/_0.55)]">
                    <Wand2 className="h-5 w-5" />
                  </div>
                  <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
                  <span className="text-[10px] text-white/40">AI 试穿</span>
                </div>

                {/* 两个效果展示 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                    <Sparkles className="h-3 w-3" /> 试穿效果
                  </div>
                  {/* 效果 1：上衣 */}
                  <div className="relative flex-1 overflow-hidden rounded-[1.1rem] border border-white/10 bg-gradient-to-b from-[oklch(0.28_0.05_195_/_0.6)] to-[oklch(0.16_0.01_195_/_0.7)]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_oklch(0.45_0.1_195_/_0.25),_transparent_70%)]" />
                    <svg viewBox="0 0 100 155" className="absolute inset-0 m-auto h-[85%] w-auto" preserveAspectRatio="xMidYMid meet">
                      <circle cx="50" cy="20" r="13" fill="url(#skinA)" />
                      {/* 穿着上衣的身体 */}
                      <path d="M33 38 Q50 32 67 38 L70 70 Q50 78 30 70 Z" fill="oklch(0.55 0.12_195)" opacity="0.92" />
                      <path d="M33 38 L24 44 L22 72 L30 78 L33 55 Z" fill="oklch(0.5 0.11_195)" opacity="0.85" />
                      <path d="M67 38 L76 44 L78 72 L70 78 L67 55 Z" fill="oklch(0.5 0.11_195)" opacity="0.85" />
                      <path d="M30 70 Q50 78 70 70 L70 95 Q50 103 30 95 Z" fill="oklch(0.35 0.02 30)" opacity="0.7" />
                      <rect x="40" y="95" width="9" height="40" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                      <rect x="51" y="95" width="9" height="40" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                    </svg>
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">上衣</span>
                  </div>
                  {/* 效果 2：连衣裙 */}
                  <div className="relative h-[42%] overflow-hidden rounded-[1.1rem] border border-white/10 bg-gradient-to-b from-[oklch(0.3_0.08_350_/_0.6)] to-[oklch(0.16_0.01_350_/_0.7)]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,_oklch(0.5_0.15_350_/_0.22),_transparent_70%)]" />
                    <svg viewBox="0 0 100 155" className="absolute inset-0 m-auto h-[85%] w-auto" preserveAspectRatio="xMidYMid meet">
                      <circle cx="50" cy="18" r="12" fill="url(#skinA)" />
                      {/* 连衣裙 */}
                      <path d="M34 34 Q50 28 66 34 L72 40 L80 105 Q50 115 20 105 L28 40 Z" fill="oklch(0.58 0.14 350)" opacity="0.92" />
                      <path d="M34 34 L25 40 L23 60 L32 55 L34 38 Z" fill="oklch(0.52 0.13_350)" opacity="0.82" />
                      <path d="M66 34 L75 40 L77 60 L68 55 L66 38 Z" fill="oklch(0.52 0.13_350)" opacity="0.82" />
                      <rect x="41" y="100" width="8" height="35" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                      <rect x="51" y="100" width="8" height="35" rx="4" fill="oklch(0.35 0.02 30)" opacity="0.6" />
                    </svg>
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">连衣裙</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24 pt-4">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 border-white/10 px-3.5 py-1 text-[12px] text-white/70">
              核心特性
            </Badge>
            <h2 className="text-[34px] font-bold tracking-[-0.02em] md:text-[48px]">
              为什么选择 FitMate
            </h2>
          </div>
          <FeatureGrid />
        </div>
      </section>

      <section id="how-it-works" className="relative px-6 pb-24 pt-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 border-white/10 px-3.5 py-1 text-[12px] text-white/70">
              超简单 · 3 步完成
            </Badge>
            <h2 className="text-[34px] font-bold tracking-[-0.02em] md:text-[48px]">
              使用方法
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {[
              {
                n: '01',
                icon: Camera,
                title: '拍一张你的照片',
                desc: '日常站立全身照效果最好，正面或侧面都可以，不需要白背景、不需要专业打光。',
              },
              {
                n: '02',
                icon: Shirt,
                title: '选一件你想试的衣服',
                desc: '电商商品图、小红书截图、衣橱平铺图都行，支持 T 恤、衬衫、连衣裙、牛仔裤。',
              },
              {
                n: '03',
                icon: Sparkles,
                title: '10 秒看到上身效果',
                desc: 'AI 保留你的身材、五官和背景，只把你身上的衣服换成目标款，颜色版型都很准。',
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-[1.6rem] glass p-7 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-20px_oklch(0_0_0_/_0.7)] md:p-8"
              >
                <div className="absolute right-6 top-5 text-[72px] font-bold leading-none text-white/[0.04]">
                  {step.n}
                </div>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.62_0.11_195_/_0.12)] text-primary shadow-[0_0_0_1px_oklch(0.62_0.11_195_/_0.25)_inset,0_18px_36px_-16px_oklch(0.62_0.11_195_/_0.45)] transition-transform duration-300 ease-out group-hover:scale-105">
                  <step.icon className="h-6.5 w-6.5" strokeWidth={2.1} />
                </div>
                <div className="relative flex flex-col gap-2">
                  <h3 className="text-[20px] font-semibold tracking-tight md:text-[22px]">
                    {step.title}
                  </h3>
                  <p className="text-[14.5px] leading-relaxed text-white/65 md:text-[15px]">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-primary/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  继续下一步 <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24 pt-4">
        <div className="mx-auto w-full max-w-6xl">
          <TeamSectionBlock />
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 rounded-[2rem] glass p-8 text-center md:p-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.62_0.11_195_/_0.16)] text-white border border-white/15 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_16px_44px_-12px_oklch(0.62_0.11_195_/_0.6)]">
            <User className="h-6 w-6" />
          </div>
          <h2 className="max-w-xl text-[28px] font-bold tracking-tight md:text-[34px]">
            不要再看模特身材瞎猜
            <br />
            <span className="text-primary">立刻在自己身上试一遍</span>
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/65 md:text-[17px]">
            每天 5 次免费额度，够用一整周的穿搭灵感，不满意随时再换一套。
          </p>
          <Button asChild size="lg" className="mt-2 h-14 rounded-[1.35rem] px-9 text-[16px]">
            <Link href="/try">
              进入试衣间
              <ArrowRight className="ml-1 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-[13px] text-white/50 backdrop-blur-sm">
        © {new Date().getFullYear()} FitMate AI · 穿搭预览仅供参考，实际版型、面料、垂感可能略有差异。
      </footer>
    </main>
  );
}
