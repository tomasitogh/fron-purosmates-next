'use client';

import { useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProducts from '@/components/admin/AdminProducts';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminStock from '@/components/admin/AdminStock';

type AdminTab = 'products' | 'orders' | 'settings' | 'stock';

export default function AdminPanel() {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: AdminTab =
    tabParam === 'orders' || tabParam === 'settings' || tabParam === 'stock'
      ? tabParam
      : 'products';

  useEffect(() => {
    if (isLoaded) {
      if (!clerkUser) {
        router.push('/');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (clerkUser.publicMetadata as any)?.role;
      if (role?.toString().toLowerCase() !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [isLoaded, clerkUser, router]);

  const handleTabChange = (tab: AdminTab) => {
    router.push(`/admin?tab=${tab}`);
  };

  if (!isLoaded || !clerkUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      </div>
    );
  }

  // IMPORTANTE: se pasa `getToken` (función) y NO un token ya generado.
  // Los JWT de Clerk vencen a los ~60s; cada componente/thunk debe pedir
  // un token fresco inmediatamente antes de cada request.
  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'products' && <AdminProducts getToken={getToken} />}
      {activeTab === 'orders' && <AdminOrders getToken={getToken} />}
      {activeTab === 'stock' && <AdminStock getToken={getToken} />}
      {activeTab === 'settings' && <AdminSettings getToken={getToken} />}
    </AdminLayout>
  );
}
