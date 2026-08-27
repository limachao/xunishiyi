'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AdminOrder, OrderDetail, PaginatedResult } from '@/lib/admin-types';
import { ORDER_STATUSES } from '@/lib/admin-types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { FilterBar } from '@/components/admin/FilterBar';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { StatusEditDialog } from '@/components/admin/StatusEditDialog';
import { OrderDetailDialog } from '@/components/admin/OrderDetailDialog';

const STATUS_OPTIONS = ORDER_STATUSES.map((s) => ({
  value: s,
  label: getOrderStatusLabel(s),
}));

function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '等待中',
    PROCESSING: '处理中',
  };
  return labels[status] ?? status;
}

interface AdminOrderResponse extends Omit<AdminOrder, 'createdAt'> {
  createdAt: string;
}

async function fetchOrders(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminOrderResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/admin/orders?${searchParams.toString()}`);
  if (!res.ok) throw new Error('加载失败');
  const json = await res.json();
  return json.data;
}

async function fetchOrderDetail(orderId: number): Promise<OrderDetail | null> {
  const res = await fetch(`/api/admin/orders/${orderId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

async function updateOrderStatusApi(orderId: number, status: string) {
  const res = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? '更新失败');
  }
  return res.json();
}

export function OrdersAdminClient() {
  const [data, setData] = useState<PaginatedResult<AdminOrderResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [detailOrder, setDetailOrder] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<AdminOrderResponse | null>(null);

  const fetchData = useCallback(
    async (currentPage: number, currentSearch: string, currentStatus: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOrders({
          page: currentPage,
          pageSize: 20,
          search: currentSearch,
          status: currentStatus || undefined,
        });
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(1, '', '');
  }, [fetchData]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchData(1, value, status);
  };

  const handleStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
    fetchData(1, search, value);
  };

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setPage(1);
    fetchData(1, '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, search, status);
  };

  const handleViewDetail = async (orderId: number) => {
    try {
      const detail = await fetchOrderDetail(orderId);
      if (detail) {
        setDetailOrder(detail);
        setDetailOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载订单详情失败');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!editingOrder) return;
    await updateOrderStatusApi(editingOrder.id, newStatus);
    fetchData(page, search, status);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">订单管理</h1>
        <p className="text-white/50 mt-1">查看和管理 AI 虚拟试衣生成记录</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <FilterBar
          searchPlaceholder="搜索订单号、用户名或邮箱..."
          search={search}
          statusOptions={STATUS_OPTIONS}
          status={status}
          onSearchChange={handleSearch}
          onStatusChange={handleStatusFilter}
          onReset={handleReset}
        />

        {error && (
          <div className="m-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/50">
            <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-[oklch(0.62_0.11_195)] rounded-full mr-3" />
            加载中...
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12 mb-3 opacity-30">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>暂无订单数据</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>服务商/模型</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>消耗积分</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-white/60">#{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <span className="text-white">{order.userName ?? '未命名'}</span>
                        <p className="text-white/40 text-xs">{order.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">{order.provider}</div>
                      <p className="text-white/40 text-xs">{order.model}</p>
                    </TableCell>
                    <TableCell className="text-white/70">
                      {formatCategory(order.category)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-white/70">{order.creditsConsumed}</TableCell>
                    <TableCell className="text-white/60 text-xs">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(order.id)}
                          className="h-7 text-xs"
                        >
                          详情
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingOrder(order)}
                          className="h-7 text-xs"
                        >
                          编辑状态
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      <OrderDetailDialog
        order={detailOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <StatusEditDialog
        open={editingOrder !== null}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        title="编辑订单状态"
        currentStatus={editingOrder?.status ?? 'PENDING'}
        statusOptions={STATUS_OPTIONS}
        onConfirm={handleUpdateStatus}
      />
    </div>
  );
}