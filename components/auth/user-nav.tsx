'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, CircleUserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthDialog, type AuthUser } from '@/components/auth/auth-dialog';

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json() as Promise<{ ok: boolean; user: AuthUser | null }>)
      .then((json) => {
        if (!cancelled) setUser(json.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-white/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-xl px-4 text-[14px] text-white/80 hover:text-white"
          onClick={() => setDialogOpen(true)}
        >
          登录 / 注册
        </Button>
        <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} onAuthSuccess={setUser} />
      </>
    );
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div className="hidden items-center gap-2 sm:flex">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || user.email}
            className="h-8 w-8 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.62_0.11_195_/_0.2)] text-[13px] font-semibold text-primary border border-white/15">
            {initial}
          </span>
        )}
        <span className="max-w-[120px] truncate text-[14px] text-white/85">
          {user.name || user.email}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 rounded-xl px-3 text-[13px] text-white/60 hover:text-white sm:hidden"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <CircleUserRound className="h-4 w-4" />
        {initial}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="hidden h-9 gap-1.5 rounded-xl px-3 text-[13px] text-white/55 hover:text-white sm:flex"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
        退出
      </Button>
    </div>
  );
}
