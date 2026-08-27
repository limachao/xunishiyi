'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AdminUser, PaginatedResult } from '@/lib/admin-types';
import { SUBSCRIPTION_STATUSES } from '@/lib/admin-types';
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
import { StatusBadge, PlanBadge } from '@/components/admin/StatusBadge';
import { StatusEditDialog } from '@/components/admin/StatusEditDialog';

const STATUS_OPTIONS = SUBSCRIPTION_STATUSES.map((s) => ({
  value: s,
  label: getStatusLabel(s),
}));

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: '活跃',
    TRIALING: '试用中',
    CANCELED: '已取消',
    PAST_DUE: '逾期',
    EXPIRED: '已过期',
  };
  return labels[status] ?? status;
}

interface AdminUserResponse extends Omit<AdminUser, 'createdAt'> {
  createdAt: string;
}

async function fetchUsers(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminUserResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('pageSize', String(params.pageSize));
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);

  const res = await fetch(`/api/admin/users?${searchParams.toString()}`);
  if (!res.ok) throw new Error('加载失败');
  const json = await res.json();
  return json.data;
}

async function updateUserStatusApi(userId: number, status: string) {
  const res = await fetch(`/api/admin/users/${userId}`, {
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

export function UsersAdminClient() {
  const [data, setData] = useState<PaginatedResult<AdminUserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (currentPage: number, currentSearch: string, currentStatus: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchUsers({
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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!editingUser) return;
    await updateUserStatusApi(editingUser.id, newStatus);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">用户管理</h1>
        <p className="text-white/50 mt-1">管理系统用户及其订阅状态</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <FilterBar
          searchPlaceholder="搜索用户名或邮箱..."
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
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
            <p>暂无用户数据</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>订阅状态</TableHead>
                  <TableHead>套餐</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-white/60">#{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name ?? '用户'}
                            className="h-8 w-8 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[oklch(0.62_0.11_195)]/30 flex items-center justify-center text-white text-xs font-medium">
                            {(user.name ?? user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white">{user.name ?? '未命名'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70">{user.email}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.subscriptionStatus} />
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={user.subscriptionPlan} />
                    </TableCell>
                    <TableCell className="text-white/60 text-xs">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user as unknown as AdminUser)}
                        className="h-7 text-xs"
                      >
                        编辑状态
                      </Button>
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

      <StatusEditDialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && setEditingUser(null)}
        title="编辑用户订阅状态"
        currentStatus={editingUser?.subscriptionStatus ?? 'ACTIVE'}
        statusOptions={STATUS_OPTIONS}
        onConfirm={handleUpdateStatus}
      />
    </div>
  );
}