import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function FavoritosPage() {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <Heart className="h-16 w-16 text-[#254642]" strokeWidth={1.5} />
      <h1 className="mt-6 text-3xl font-bold text-[#254642]">Tus favoritos</h1>
      <p className="mt-3 max-w-md text-gray-600">
        Esta sección está en camino. Muy pronto vas a poder guardar acá tus mates preferidos para
        encontrarlos rápido.
      </p>
      <Link
        href="/shop"
        className="mt-8 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
      >
        Explorar la tienda
      </Link>
    </section>
  );
}
