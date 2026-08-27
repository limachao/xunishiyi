'use client';

import { AdminLayoutContent } from './AdminLayout';

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
