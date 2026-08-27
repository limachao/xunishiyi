'use client';

import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

const teamMembers = [
  {
    name: '马超',
    role: '创始人 & CEO',
    bio: '十年电商行业经验，前某头部服饰品牌数字化负责人，致力于用 AI 改变购物决策方式。',
    avatar: '/images/avatar.png',
    gradient: 'from-[oklch(0.62_0.11_195_/_0.25)] to-[oklch(0.42_0.09_155_/_0.15)]',
    socials: [
      { icon: Twitter, label: 'Twitter', href: '#' },
      { icon: Github, label: 'Github', href: '#' },
    ],
  },
];

export function TeamSectionBlock() {
  return (
    <div className="w-full">
      <div className="mb-14 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border border-white/10 px-3.5 py-1 text-[12px] text-white/70">
          团队
        </span>
        <h2 className="text-[34px] font-bold tracking-[-0.02em] md:text-[48px]">
          认识 FitMate 团队
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60 md:text-[17px]">
          我们是一群热爱时尚与技术的创造者，致力于让每个人都能轻松预览穿搭效果。
        </p>
      </div>

      <div className="grid grid-cols-1 mx-auto max-w-sm">
        {teamMembers.map((member) => (
          <div
            key={member.name}
            className="group relative rounded-2xl border border-white/10 p-2 md:rounded-3xl bg-white/[0.02]"
          >
            <GlowingEffect
              blur={0}
              spread={40}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
              glow={true}
              disabled={false}
            />
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[oklch(0.14_0.008_155_/_0.7)] p-6 backdrop-blur-xl">
              <div className="flex flex-1 flex-col items-center text-center">
                <div
                  className={`mb-5 flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br ${member.gradient} text-2xl font-bold text-white border border-white/15 overflow-hidden`}
                >
                  {member.avatar.startsWith('/') ? (
                    <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    member.avatar
                  )}
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {member.name}
                </h3>
                <p className="mt-1 text-[13px] font-medium text-[oklch(0.68_0.11_195)]">
                  {member.role}
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  {member.bio}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-center gap-3 border-t border-white/8 pt-5">
                {member.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/60 transition-all duration-200 hover:border-[oklch(0.62_0.11_195_/_0.4)] hover:bg-[oklch(0.62_0.11_195_/_0.12)] hover:text-[oklch(0.68_0.11_195)]"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
