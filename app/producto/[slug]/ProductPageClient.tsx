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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#254642] mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando producto...</p>
      </div>
    </div>
  );
}
