'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cloudinaryLoader } from '@/lib/cloudinary';

const loaderFor = (src) => (src.includes('res.cloudinary.com') ? cloudinaryLoader : undefined);

function getTitle(cat) {
  return cat.title || cat.description || '';
}

export default function CategoryGrid({ categories }) {
  const hasDynamicCategories =
    Array.isArray(categories) && categories.length > 0 && categories[0]?.imageUrl;
  const categoryList = hasDynamicCategories ? categories : [];

  if (categoryList.length === 0) {
    if (!categories) return null;
    const { mate, bombilla, accesorios } = categories;
    if (!mate) return null;

    return (
      <section className="mx-auto my-4 w-full max-w-4xl px-4 md:my-8 md:px-8">
        <h2 className="mb-6 border-l-4 border-[#254642] px-4 text-xl font-bold text-gray-900 md:mb-10 md:text-3xl">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link
            href="/shop?category=mate"
            className="group relative col-span-1 row-span-2 aspect-[3/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
          >
            <Image
              src={mate}
              alt="Mate"
              loader={loaderFor(mate)}
              fill
              className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 50vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                Mates
              </div>
            </div>
          </Link>
          <Link
            href="/shop?category=bombilla"
            className="group relative aspect-[6/5] cursor-pointer overflow-hidden rounded-2xl shadow-md"
          >
            <Image
              src={bombilla}
              alt="Bombilla"
              loader={loaderFor(bombilla)}
              fill
              className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                Bombillas
              </div>
            </div>
          </Link>
          <Link
            href="/shop?category=accesorio"
            className="group relative aspect-[6/5] cursor-pointer overflow-hidden rounded-2xl shadow-md"
          >
            <Image
              src={accesorios}
              alt="Accesorios"
              loader={loaderFor(accesorios)}
              fill
              className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                Accesorios
              </div>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  const count = categoryList.length;

  if (count === 2) {
    return (
      <section className="mx-auto my-4 w-full max-w-4xl px-4 md:my-8 md:px-8">
        <h2 className="mb-6 border-l-4 border-[#254642] px-4 text-xl font-bold text-gray-900 md:mb-10 md:text-3xl">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link
            href={categoryList[0].link || '#'}
            className="group relative col-span-1 row-span-2 aspect-[3/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
          >
            <Image
              src={categoryList[0].imageUrl}
              alt={getTitle(categoryList[0]) || 'Categoría'}
              loader={loaderFor(categoryList[0].imageUrl)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 50vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                {getTitle(categoryList[0])}
              </div>
            </div>
          </Link>
          <Link
            href={categoryList[1].link || '#'}
            className="group relative col-span-1 aspect-[3/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
          >
            <Image
              src={categoryList[1].imageUrl}
              alt={getTitle(categoryList[1]) || 'Categoría'}
              loader={loaderFor(categoryList[1].imageUrl)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 50vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                {getTitle(categoryList[1])}
              </div>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  if (count >= 3) {
    return (
      <section className="mx-auto my-4 w-full max-w-4xl px-4 md:my-8 md:px-8">
        <h2 className="mb-6 border-l-4 border-[#254642] px-4 text-xl font-bold text-gray-900 md:mb-10 md:text-3xl">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link
            href={categoryList[0].link || '#'}
            className="group relative col-span-1 row-span-2 aspect-[3/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
          >
            <Image
              src={categoryList[0].imageUrl}
              alt={getTitle(categoryList[0]) || 'Categoría'}
              loader={loaderFor(categoryList[0].imageUrl)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 50vw"
            />
            <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
              <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                {getTitle(categoryList[0])}
              </div>
            </div>
          </Link>
          <div className="flex flex-col gap-1 md:gap-1">
            <Link
              href={categoryList[1].link || '#'}
              className="group relative aspect-[6/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
            >
              <Image
                src={categoryList[1].imageUrl}
                alt={getTitle(categoryList[1]) || 'Categoría'}
                loader={loaderFor(categoryList[1].imageUrl)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                  {getTitle(categoryList[1])}
                </div>
              </div>
            </Link>
            <Link
              href={categoryList[2].link || '#'}
              className="group relative aspect-[6/5] cursor-pointer overflow-hidden rounded-2xl shadow-lg"
            >
              <Image
                src={categoryList[2].imageUrl}
                alt={getTitle(categoryList[2]) || 'Categoría'}
                loader={loaderFor(categoryList[2].imageUrl)}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 py-2 md:px-6 md:py-3">
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white shadow-lg backdrop-blur-md md:px-6 md:py-2 md:text-base">
                  {getTitle(categoryList[2])}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
