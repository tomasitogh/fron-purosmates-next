import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F2E9] p-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-[#254642]/10 bg-white p-8 shadow-xl">
        <div className="relative mb-6 flex justify-center">
          <span className="absolute scale-150 text-8xl opacity-20 blur-sm">🌿</span>
          <span className="relative z-10 text-6xl">🤔</span>
        </div>

        <h1 className="-mt-16 mb-2 text-8xl font-black text-[#254642]/10 select-none">404</h1>

        <h2 className="relative z-10 mb-4 text-3xl font-bold text-[#254642]">
          ¡Nos quedamos sin yerba!
        </h2>

        <p className="relative z-10 mb-8 text-lg text-gray-600">
          La página que buscás no existe, fue movida o quizás nunca estuvo aquí.
        </p>

        <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#254642] px-6 py-3 font-medium text-white transition-colors hover:bg-[#1a3330]"
          >
            <Home size={20} />
            Ir al inicio
          </Link>

          <Link
            href="/?category=mate"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#254642] px-6 py-3 font-medium text-[#254642] transition-colors hover:bg-[#254642]/5"
          >
            <ShoppingBag size={20} />
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
