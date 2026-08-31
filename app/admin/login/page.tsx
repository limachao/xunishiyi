'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TurnstileWidget,
  isTurnstileEnabled,
} from '@/components/turnstile/TurnstileWidget';

export default function AdminLoginPage() {
  const router = useRouter();
  const turnstileEnabled = React.useMemo(() => isTurnstileEnabled(), []);
  const [password, setPassword] = React.useState('');
  const [tsToken, setTsToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, turnstileToken: tsToken }),
      });
      const json = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setError(json.message ?? '登录失败，请重试。');
        setTsToken(null);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('网络错误，请重试。');
      setTsToken(null);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && password.length > 0 && (turnstileEnabled ? Boolean(tsToken) : true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.05_0.005_155)] p-6">
      <Card className="w-full max-w-sm border-white/10 bg-[oklch(0.08_0.008_155)]">
        <CardContent className="flex flex-col items-center gap-5 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[oklch(0.62_0.11_195_/_0.15)] text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-semibold text-white">管理后台登录</h1>
            <p className="text-[13px] text-white/55">
              请输入管理密码并完成人机验证。
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password" className="text-[13px] text-white/70">
                管理密码
              </Label>
              <Input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入管理员密码"
                maxLength={200}
                className="h-11 rounded-xl border-white/10 bg-white/5 text-[14px]"
                autoComplete="current-password"
              />
            </div>

            {turnstileEnabled && (
              <TurnstileWidget
                key={tsToken === null ? 'ts-retry' : 'ts-ok'}
                action="admin-login"
                onToken={setTsToken}
                className="flex min-h-[65px] items-center justify-center"
              />
            )}

            {error && (
              <p className="text-[13px] font-medium text-red-400" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  登录中…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  登录管理后台
                </>
              )}
            </Button>
          </form>

          <Link href="/" className="text-[12px] text-white/45 hover:text-white/70">
            返回首页
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
