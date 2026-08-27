import { Badge } from '@/components/ui/badge';

const statusVariantMap: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  TRIALING: 'secondary',
  CANCELED: 'destructive',
  PAST_DUE: 'warning',
  EXPIRED: 'secondary',
  SUCCESS: 'success',
  FAILED: 'destructive',
  PENDING: 'warning',
  PROCESSING: 'default',
};

const statusLabelMap: Record<string, string> = {
  ACTIVE: '活跃',
  TRIALING: '试用中',
  CANCELED: '已取消',
  PAST_DUE: '逾期',
  EXPIRED: '已过期',
  SUCCESS: '成功',
  FAILED: '失败',
  PENDING: '等待中',
  PROCESSING: '处理中',
  FREE: '免费版',
  PRO_MONTHLY: '专业版月付',
  PRO_YEARLY: '专业版年付',
  PREMIUM_MONTHLY: '高级版月付',
  PREMIUM_YEARLY: '高级版年付',
};

interface StatusBadgeProps {
  status: string | null | undefined;
  type?: 'subscription' | 'order';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  if (!status) {
    return <Badge variant="outline">未知</Badge>;
  }

  const variant = statusVariantMap[status.toUpperCase()] ?? 'secondary';
  const label = statusLabelMap[status.toUpperCase()] ?? status;

  return <Badge variant={variant}>{label}</Badge>;
}

export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  if (!plan) return null;

  const variant = plan === 'FREE' ? 'outline' : 'default';
  const label = statusLabelMap[plan] ?? plan;

  return <Badge variant={variant}>{label}</Badge>;
}
