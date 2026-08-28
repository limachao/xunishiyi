'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/contexts/GameContext';
import type { SubscriptionInfo, UsageInfo } from '@/types/game';
import { AuthDialog } from '@/components/auth/auth-dialog';

export interface AuthGateUser {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
}

export interface AuthGateSubscription {
  plan: SubscriptionInfo['plan'];
  status: SubscriptionInfo['status'];
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

export interface AuthGateUsage {
  totalCredits: number;
  usedCredits: number;
  bonusCredits: number;
  remainingCredits: number;
  lastResetAt: string | null;
}

export interface AuthGateState {
  user: AuthGateUser;
  subscription: AuthGateSubscription | null;
  usage: AuthGateUsage | null;
}

interface AuthGateContextValue {
  isAuthed: boolean;
  /** 未登录时弹出登录窗并返回 false；已登录返回 true。用于在上传等动作前拦截。 */
  requireAuth: () => boolean;
}

const AuthGateContext = React.createContext<AuthGateContextValue>({
  isAuthed: false,
  requireAuth: () => false,
});

export function useAuthGate(): AuthGateContextValue {
  return React.useContext(AuthGateContext);
}

const FALLBACK_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'FREE',
  status: 'ACTIVE',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

interface AuthGateProviderProps {
  /** server 端查询的登录用户及其订阅/额度；null 表示未登录 */
  authState: AuthGateState | null;
  children: React.ReactNode;
}

/** 由 server 端注入登录态；未登录时在任意 requireAuth() 调用处悬浮弹出透明登录窗 */
export function AuthGateProvider({ authState, children }: AuthGateProviderProps) {
  const { dispatch } = useGame();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const isAuthed = Boolean(authState);

  // 把 server 端查询的登录态同步进全局状态（含订阅与额度）
  React.useEffect(() => {
    if (!authState) return;
    dispatch({
      type: 'USER_SET',
      payload: {
        profile: {
          id: String(authState.user.id),
          email: authState.user.email,
          name: authState.user.name,
          image: authState.user.image,
        },
        subscription: authState.subscription ?? FALLBACK_SUBSCRIPTION,
        usage:
          authState.usage ?? {
            totalCredits: 5,
            usedCredits: 0,
            bonusCredits: 0,
            remainingCredits: 5,
            lastResetAt: null,
          },
      },
    });
  }, [authState, dispatch]);

  const requireAuth = React.useCallback(() => {
    if (isAuthed) return true;
    setDialogOpen(true);
    return false;
  }, [isAuthed]);

  return (
    <AuthGateContext.Provider value={{ isAuthed, requireAuth }}>
      {children}
      <AuthDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAuthSuccess={() => router.refresh()}
      />
    </AuthGateContext.Provider>
  );
}
