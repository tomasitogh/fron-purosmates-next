import Image from 'next/image';
import Link from 'next/link';
import { FeaturedProduct } from '@/lib/data/home';

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

export function cloudinaryUrl(src: string, width: number) {
  if (!src.includes('res.cloudinary.com')) return src;
  const params = ['f_auto', 'q_auto', `w_${width}`].join(',');
  return src.replace('/upload/', `/upload/${params}/`);
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <section id="productos-destacados" className="bg-white py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mb-12">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
              Nuestros favoritos
            </p>
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Productos destacados</h2>
            <p className="mt-2 max-w-xl text-sm text-gray-600 md:text-base">
              Los mates y accesorios más valorados por nuestra comunidad, seleccionados a mano.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#254642] px-5 py-2 text-sm font-semibold text-[#254642] transition-colors hover:bg-[#254642] hover:text-white"
          >
            Ver todos los productos
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {products.map((product) => {
            const transform = product.image
              ? {
                  scale: product.image.scale || 1,
                  x: product.image.x || 0,
                  y: product.image.y || 0,
                }
              : { scale: 1, x: 0, y: 0 };

            return (
              <Link
                key={product.id}
                href={`/producto/${product.slug || product.id}`}
                className="group w-52 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md sm:w-64"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                  {product.image ? (
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.scale})`,
                        transformOrigin: 'center',
                      }}
                    >
                      <Image
                        src={cloudinaryUrl(product.image.url, 640)}
                        alt={`${product.name} - Mates artesanales Puros Mates`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 65vw, 260px"
                        loading="lazy"
                        decoding="async"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      Sin Imagen
                    </div>
                  )}
                </div>
                <div className="flex flex-col p-3">
                  <p className="text-[10px] font-semibold tracking-wide text-[#D4AF37] uppercase">
                    {product.categoryDescription || 'Puros Mates'}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="mt-auto pt-2 text-base font-bold text-[#254642]">
                    ${product.price.toLocaleString('es-AR')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
