'use client';

import { Badge } from '@/components/ui/badge';

interface OrderDetailProps {
  order: {
    id: number;
    userName: string | null;
    userEmail: string;
    provider: string;
    model: string;
    status: string;
    creditsConsumed: number;
    category: string | null;
    createdAt: Date;
    prompt: string | null;
    negativePrompt: string | null;
    personImageUrl: string | null;
    clothingImageUrl: string | null;
    resultImageUrl: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    generationMs: number | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailProps) {
  if (!open || !order) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCategory = (category: string | null) => {
    if (!category) return '-';
    const map: Record<string, string> = {
      TOP: '上衣',
      BOTTOM: '下装',
      DRESS: '连衣裙',
      UNKNOWN: '未知',
    };
    return map[category] ?? category;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 bg-[oklch(0.08_0.008_155)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white">订单详情 #{order.id}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">用户</span>
              <p className="text-white mt-1">{order.userName ?? '未命名'} ({order.userEmail})</p>
            </div>
            <div>
              <span className="text-white/50">状态</span>
              <p className="mt-1">
                <Badge variant={order.status === 'SUCCESS' ? 'success' : order.status === 'FAILED' ? 'destructive' : 'warning'}>
                  {order.status}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-white/50">服务商</span>
              <p className="text-white mt-1">{order.provider}</p>
            </div>
            <div>
              <span className="text-white/50">模型</span>
              <p className="text-white mt-1">{order.model}</p>
            </div>
            <div>
              <span className="text-white/50">分类</span>
              <p className="text-white mt-1">{formatCategory(order.category)}</p>
            </div>
            <div>
              <span className="text-white/50">消耗积分</span>
              <p className="text-white mt-1">{order.creditsConsumed}</p>
            </div>
            <div className="col-span-2">
              <span className="text-white/50">创建时间</span>
              <p className="text-white mt-1">{formatDate(order.createdAt)}</p>
            </div>
            {order.generationMs !== null && (
              <div className="col-span-2">
                <span className="text-white/50">生成耗时</span>
                <p className="text-white mt-1">{(order.generationMs / 1000).toFixed(2)} 秒</p>
              </div>
            )}
          </div>

          {order.errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <span className="text-sm text-red-300 font-medium">错误信息</span>
              <p className="mt-1 text-sm text-red-200">
                {order.errorCode && <span className="font-mono mr-2">{order.errorCode}</span>}
                {order.errorMessage}
              </p>
            </div>
          )}

          {(order.resultImageUrl || order.personImageUrl || order.clothingImageUrl) && (
            <div>
              <span className="text-white/50 text-sm">图片</span>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {order.personImageUrl && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">人物图</p>
                    <img
                      src={order.personImageUrl}
                      alt="人物图"
                      className="w-full aspect-square rounded-lg object-cover border border-white/10"
                    />
                  </div>
                )}
                {order.clothingImageUrl && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">服装图</p>
                    <img
                      src={order.clothingImageUrl}
                      alt="服装图"
                      className="w-full aspect-square rounded-lg object-cover border border-white/10"
                    />
                  </div>
                )}
                {order.resultImageUrl && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">结果图</p>
                    <img
                      src={order.resultImageUrl}
                      alt="结果图"
                      className="w-full aspect-square rounded-lg object-cover border border-white/10"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {order.prompt && (
            <div>
              <span className="text-white/50 text-sm">Prompt</span>
              <p className="mt-1 text-sm text-white/80 bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
                {order.prompt}
              </p>
            </div>
          )}

          {order.negativePrompt && (
            <div>
              <span className="text-white/50 text-sm">Negative Prompt</span>
              <p className="mt-1 text-sm text-white/80 bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto">
                {order.negativePrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
