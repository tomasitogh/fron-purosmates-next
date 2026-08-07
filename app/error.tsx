'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F2E9] p-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-[#254642]/10 bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <span className="text-6xl">🧉</span>
        </div>

        <h2 className="mb-4 text-3xl font-bold text-[#254642]">Uy, se nos volcó el mate</h2>

        <p className="mb-8 text-lg text-gray-600">
          Estamos arreglando la tienda, volvé a intentar en unos instantes.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#254642] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1a3330]"
          >
            <RefreshCcw size={20} />
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#254642] px-6 py-3 font-medium text-[#254642] transition-colors hover:bg-[#254642]/5"
          >
            <Home size={20} />
            Ir al inicio
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 max-h-40 overflow-auto rounded bg-red-50 p-4 text-left text-sm text-red-800">
            <p className="mb-1 font-bold">Error para desarrolladores:</p>
            <pre className="whitespace-pre-wrap">{error.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
