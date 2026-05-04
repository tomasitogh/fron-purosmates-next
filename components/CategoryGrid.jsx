import Image from 'next/image';
import Link from 'next/link';

function getTitle(cat) {
  return cat.title || cat.description || '';
}

export default function CategoryGrid({ categories }) {
  const hasDynamicCategories = Array.isArray(categories) && categories.length > 0 && categories[0]?.imageUrl;
  const categoryList = hasDynamicCategories ? categories : [];
  
  if (categoryList.length === 0) {
    const { mate, bombilla, accesorios } = categories;
    if (!mate) return null;
    
    return (
      <section className="w-full my-4 md:my-8 mx-auto max-w-4xl px-4 md:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-10 px-4 border-l-4 border-[#254642]">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link href="/shop?category=mate" className="col-span-1 row-span-2 relative aspect-[3/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
            <Image src={mate} alt="Mate" fill className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
                Mates
              </div>
            </div>
          </Link>
          <Link href="/shop?category=bombilla" className="relative aspect-[6/5] overflow-hidden group shadow-md rounded-2xl cursor-pointer">
            <Image src={bombilla} alt="Bombilla" fill className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
                Bombillas
              </div>
            </div>
          </Link>
          <Link href="/shop?category=accesorio" className="relative aspect-[6/5] overflow-hidden group shadow-md rounded-2xl cursor-pointer">
            <Image src={accesorios} alt="Accesorios" fill className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
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
      <section className="w-full my-4 md:my-8 mx-auto max-w-4xl px-4 md:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-10 px-4 border-l-4 border-[#254642]">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link href={categoryList[0].link || '#'} className="col-span-1 row-span-2 relative aspect-[3/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
            <Image src={categoryList[0].imageUrl} alt={getTitle(categoryList[0]) || 'Categoría'} fill priority className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
                {getTitle(categoryList[0])}
              </div>
            </div>
          </Link>
          <Link href={categoryList[1].link || '#'} className="col-span-1 relative aspect-[3/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
            <Image src={categoryList[1].imageUrl} alt={getTitle(categoryList[1]) || 'Categoría'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
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
      <section className="w-full my-4 md:my-8 mx-auto max-w-4xl px-4 md:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-10 px-4 border-l-4 border-[#254642]">
          Nuestras categorías
        </h2>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Link href={categoryList[0].link || '#'} className="col-span-1 row-span-2 relative aspect-[3/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
            <Image src={categoryList[0].imageUrl} alt={getTitle(categoryList[0]) || 'Categoría'} fill priority className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
                {getTitle(categoryList[0])}
              </div>
            </div>
          </Link>
          <div className="flex flex-col gap-1 md:gap-1">
            <Link href={categoryList[1].link || '#'} className="relative aspect-[6/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
              <Image src={categoryList[1].imageUrl} alt={getTitle(categoryList[1]) || 'Categoría'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
                  {getTitle(categoryList[1])}
                </div>
              </div>
            </Link>
            <Link href={categoryList[2].link || '#'} className="relative aspect-[6/5] overflow-hidden group shadow-lg rounded-2xl cursor-pointer">
              <Image src={categoryList[2].imageUrl} alt={getTitle(categoryList[2]) || 'Categoría'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-2 md:px-6 py-2 md:py-3 rounded-2xl">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 md:px-6 py-1 md:py-2 rounded-lg text-white text-sm md:text-base font-medium shadow-lg">
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