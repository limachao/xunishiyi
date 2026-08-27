export const SUBSCRIPTION_STATUSES = ['ACTIVE', 'CANCELED', 'PAST_DUE', 'EXPIRED', 'TRIALING'] as const;

export const ORDER_STATUSES = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING'] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface DashboardStats {
  totalUsers: number;
  recentUsers: number;
  totalOrders: number;
  recentOrders: number;
  totalCreditsConsumed: number;
  recentCreditsConsumed: number;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
}

export interface AdminOrder {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string;
  provider: string;
  model: string;
  status: string;
  creditsConsumed: number;
  category: string | null;
  createdAt: Date;
}

export interface OrderDetail extends AdminOrder {
  prompt: string | null;
  negativePrompt: string | null;
  personImageUrl: string | null;
  clothingImageUrl: string | null;
  resultImageUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  generationMs: number | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
