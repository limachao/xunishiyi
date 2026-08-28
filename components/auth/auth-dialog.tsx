'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, User as UserIcon, Lock, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TurnstileWidget,
  isTurnstileEnabled,
} from '@/components/turnstile/TurnstileWidget';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
}

type AuthMode = 'login' | 'register';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: (user: AuthUser) => void;
}

export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>('login');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tsToken, setTsToken] = React.useState<string | null>(null);
  const [tsRetry, setTsRetry] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const turnstileEnabled = React.useMemo(() => isTurnstileEnabled(), []);
  const turnstileAction = mode === 'login' ? 'login' : 'register';

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setTsToken(null);
    setTsRetry((n) => n + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password, turnstileToken: tsToken }
          : { email, name, password, turnstileToken: tsToken };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; message?: string; user?: AuthUser };

      if (!res.ok || !json.ok || !json.user) {
        setError(json.message ?? '操作失败，请重试。');
        // token 一次性，失败后重置人机验证
        setTsToken(null);
        setTsRetry((n) => n + 1);
        return;
      }

      onAuthSuccess(json.user);
      onOpenChange(false);
      router.refresh();
    } catch {
      setError('网络错误，请重试。');
      setTsToken(null);
      setTsRetry((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !loading &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    (mode === 'login' || true) &&
    (turnstileEnabled ? Boolean(tsToken) : true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-glass max-w-md sm:rounded-[1.6rem]">
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(0.62_0.11_195_/_0.15)] text-primary">
            <Shirt className="h-5.5 w-5.5" />
          </div>
          <DialogTitle className="text-xl">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            {mode === 'login'
              ? '登录后可保存试穿历史和素材库'
              : '注册即送 5 次免费试穿额度'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-name" className="text-[13px] text-white/70">昵称（可选）</Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="怎么称呼你"
                  maxLength={100}
                  className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-[14px]"
                  autoComplete="nickname"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email" className="text-[13px] text-white/70">邮箱</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-[14px]"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password" className="text-[13px] text-white/70">密码</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <Input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? '输入密码' : '至少 6 位'}
                maxLength={100}
                className="h-11 rounded-xl border-white/10 bg-white/5 pl-9 text-[14px]"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {turnstileEnabled && (
            <TurnstileWidget
              key={`${turnstileAction}-${tsRetry}`}
              action={turnstileAction}
              onToken={setTsToken}
              className="flex min-h-[65px] items-center justify-center"
            />
          )}

          {error && (
            <p className="text-[13px] font-medium text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={!canSubmit} className="h-12 rounded-xl text-[15px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                处理中…
              </>
            ) : mode === 'login' ? (
              '登录'
            ) : (
              '注册并领取 5 次免费额度'
            )}
          </Button>

          <p className="text-center text-[13px] text-white/55">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ml-1 font-medium text-primary hover:underline"
            >
              {mode === 'login' ? '免费注册' : '去登录'}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
