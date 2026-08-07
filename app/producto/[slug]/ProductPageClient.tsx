'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProductPageClientProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPageClient({ params }: ProductPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    params.then((resolvedParams) => {
      // Redirigir al home con el query param usando replace para no agregar historial
      router.replace(`/?producto=${resolvedParams.slug}`);
    });
  }, [params, router]);

  // Mostrar un loader mientras redirige
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#254642]"></div>
        <p className="mt-4 text-gray-600">Cargando producto...</p>
      </div>
    </div>
  );
}
