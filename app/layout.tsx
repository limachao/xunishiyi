import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { GameProvider } from '@/contexts/GameContext';

export const metadata: Metadata = {
  title: {
    default: '晴天专属试衣网站',
    template: '%s | FitMate AI',
  },
  description:
    '上传你的照片和任意服装图，10–20 秒生成真实试穿效果，支持上衣、下装和连衣裙。',
  keywords: [
    '虚拟试衣',
    'AI 换装',
    '在线试衣',
    '穿搭预览',
    'AI 服装搭配',
    '虚拟试穿',
  ],
  authors: [{ name: 'FitMate AI' }],
  applicationName: 'FitMate AI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitMate AI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://fitmate.ai',
    siteName: 'FitMate AI',
    title: '晴天专属试衣网站',
    description:
      '买之前先看上身效果，免费试 5 次，AI 生成真实穿搭预览。',
  },
  icons: {
    apple: [{ url: '/icon.svg', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050509' },
    { media: '(prefers-color-scheme: light)', color: '#050509' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen relative antialiased apple-scroll',
          'selection:bg-[oklch(0.62_0.11_195_/_0.35)]',
        )}
      >
        <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
          <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-[oklch(0.62_0.11_195_/_0.18)] blur-3xl" />
          <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-[oklch(0.42_0.09_155_/_0.18)] blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-[36rem] w-[36rem] rounded-full bg-[oklch(0.45_0.1_195_/_0.16)] blur-3xl" />
        </div>
        <GameProvider>
          <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
        </GameProvider>
      </body>
    </html>
  );
}
