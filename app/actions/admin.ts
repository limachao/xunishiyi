'use server';

import {
  eq,
  like,
  or,
  sql,
  desc,
  and,
  count,
} from 'drizzle-orm';
import { db } from '@/lib/db/index';
import { users, subscriptions, generationRecords } from '@/lib/db/schema';
import { isAdminOnServer } from '@/lib/admin';
import type {
  DashboardStats,
  AdminUser,
  AdminOrder,
  OrderDetail,
  PaginatedResult,
} from '@/lib/admin-types';

const DEFAULT_PAGE_SIZE = 20;

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!(await isAdminOnServer())) {
    throw new Error('Unauthorized');
  }
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [userCountResult] = await db
    .select({ count: count() })
    .from(users);

  const [recentUserCountResult] = await db
    .select({ count: count() })
    .from(users)
    .where(sql`${users.createdAt} >= ${sevenDaysAgo}`);

  const [orderCountResult] = await db
    .select({ count: count() })
    .from(generationRecords);

  const [recentOrderCountResult] = await db
    .select({ count: count() })
    .from(generationRecords)
    .where(sql`${generationRecords.createdAt} >= ${sevenDaysAgo}`);

  const [creditsResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${generationRecords.creditsConsumed}), 0)`,
    })
    .from(generationRecords)
    .where(eq(generationRecords.status, 'SUCCESS'));

  const [recentCreditsResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${generationRecords.creditsConsumed}), 0)`,
    })
    .from(generationRecords)
    .where(
      and(
        eq(generationRecords.status, 'SUCCESS'),
        sql`${generationRecords.createdAt} >= ${sevenDaysAgo}`
      )
    );

  return {
    totalUsers: Number(userCountResult?.count ?? 0),
    recentUsers: Number(recentUserCountResult?.count ?? 0),
    totalOrders: Number(orderCountResult?.count ?? 0),
    recentOrders: Number(recentOrderCountResult?.count ?? 0),
    totalCreditsConsumed: Number(creditsResult?.total ?? 0),
    recentCreditsConsumed: Number(recentCreditsResult?.total ?? 0),
  };
}

export async function getAdminUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminUser>> {
  if (!(await isAdminOnServer())) {
    throw new Error('Unauthorized');
  }
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        like(users.name, `%${params.search}%`),
        like(users.email, `%${params.search}%`)
      )
    );
  }

  if (params.status) {
    conditions.push(sql`${subscriptions.status} = ${params.status}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = db
    .select({ count: count() })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id));

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [countResult] = await countQuery;
  const total = Number(countResult?.count ?? 0);

  const data = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
      subscriptionStatus: subscriptions.status,
      subscriptionPlan: subscriptions.plan,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateUserStatus(
  userId: number,
  status: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdminOnServer())) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const validStatuses = ['ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED', 'TRIALING'];
    if (!validStatuses.includes(status)) {
      return { success: false, error: '无效的状态值' };
    }

    await db
      .update(subscriptions)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId));

    return { success: true };
  } catch (error) {
    console.error('[Admin] updateUserStatus error:', error);
    return { success: false, error: '更新用户状态失败' };
  }
}

export async function getAdminOrders(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<AdminOrder>> {
  if (!(await isAdminOnServer())) {
    throw new Error('Unauthorized');
  }
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (params.search) {
    const searchPattern = `%${params.search}%`;
    conditions.push(
      or(
        like(users.name, searchPattern),
        like(users.email, searchPattern),
        sql`CAST(${generationRecords.id} AS TEXT) ILIKE ${searchPattern}`
      )
    );
  }

  if (params.status) {
    conditions.push(eq(generationRecords.status, params.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = db
    .select({ count: count() })
    .from(generationRecords)
    .leftJoin(users, eq(users.id, generationRecords.userId));

  if (whereClause) {
    countQuery.where(whereClause);
  }

  const [countResult] = await countQuery;
  const total = Number(countResult?.count ?? 0);

  const data = await db
    .select({
      id: generationRecords.id,
      userId: generationRecords.userId,
      userName: users.name,
      userEmail: users.email,
      provider: generationRecords.provider,
      model: generationRecords.model,
      status: generationRecords.status,
      creditsConsumed: generationRecords.creditsConsumed,
      category: generationRecords.category,
      createdAt: generationRecords.createdAt,
    })
    .from(generationRecords)
    .leftJoin(users, eq(users.id, generationRecords.userId))
    .where(whereClause)
    .orderBy(desc(generationRecords.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map((row) => ({
      ...row,
      userName: row.userName ?? null,
      userEmail: row.userEmail ?? '',
      category: row.category ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOrderDetail(orderId: number): Promise<OrderDetail | null> {
  if (!(await isAdminOnServer())) {
    throw new Error('Unauthorized');
  }
  const result = await db
    .select({
      id: generationRecords.id,
      userId: generationRecords.userId,
      userName: users.name,
      userEmail: users.email,
      provider: generationRecords.provider,
      model: generationRecords.model,
      status: generationRecords.status,
      creditsConsumed: generationRecords.creditsConsumed,
      category: generationRecords.category,
      createdAt: generationRecords.createdAt,
      prompt: generationRecords.prompt,
      negativePrompt: generationRecords.negativePrompt,
      personImageUrl: generationRecords.personImageUrl,
      clothingImageUrl: generationRecords.clothingImageUrl,
      resultImageUrl: generationRecords.resultImageUrl,
      errorCode: generationRecords.errorCode,
      errorMessage: generationRecords.errorMessage,
      generationMs: generationRecords.generationMs,
    })
    .from(generationRecords)
    .leftJoin(users, eq(users.id, generationRecords.userId))
    .where(eq(generationRecords.id, orderId));

  if (!result.length) return null;

  const row = result[0];
  return {
    ...row,
    userName: row.userName ?? null,
    userEmail: row.userEmail ?? '',
    category: row.category ?? null,
    prompt: row.prompt ?? null,
    negativePrompt: row.negativePrompt ?? null,
    personImageUrl: row.personImageUrl ?? null,
    clothingImageUrl: row.clothingImageUrl ?? null,
    resultImageUrl: row.resultImageUrl ?? null,
    errorCode: row.errorCode ?? null,
    errorMessage: row.errorMessage ?? null,
    generationMs: row.generationMs ?? null,
  };
}

export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdminOnServer())) {
    return { success: false, error: 'Unauthorized' };
  }
  try {
    const validStatuses = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return { success: false, error: '无效的订单状态值' };
    }

    await db
      .update(generationRecords)
      .set({ status: status.toUpperCase() })
      .where(eq(generationRecords.id, orderId));

    return { success: true };
  } catch (error) {
    console.error('[Admin] updateOrderStatus error:', error);
    return { success: false, error: '更新订单状态失败' };
  }
}
