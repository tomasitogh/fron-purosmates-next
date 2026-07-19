'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AjustesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=settings');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xl text-gray-500">Redirigiendo...</div>
    </div>
  );
}
