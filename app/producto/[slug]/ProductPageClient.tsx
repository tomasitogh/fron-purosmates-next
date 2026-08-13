'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProductPageClientProps {
  params: Promise<{ slug: string }>;
  productName?: string;
}

export default function ProductPageClient({ params, productName }: ProductPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    // Sync URL state if needed, but do NOT redirect away
    // This component can be used to hydrate interactive elements
  }, [params]);

  const handleGoToShop = () => {
    router.push(`/shop?producto=${productName?.toLowerCase().replace(/\s+/g, '-') || ''}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleGoToShop}
        className="w-full rounded-lg bg-[#254642] py-3 font-semibold text-white shadow-lg transition hover:bg-[#254642]/90 active:scale-[0.98]"
      >
        Ver opciones y agregar al carrito
      </button>
      <p className="text-center text-sm text-gray-500">
        Envíos a todo el país por Correo Argentino
      </p>
    </div>
  );
}
