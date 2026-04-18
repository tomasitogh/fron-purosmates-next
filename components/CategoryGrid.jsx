import Image from 'next/image';
import Link from 'next/link';

export default function CategoryGrid({ categories }) {
  // categories: { mate: string, bombilla: string, accesorios: string }
  return (
    <section className="w-full my-4 md:my-8 mx-auto max-w-7xl px-4 md:px-8">
      <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-10 px-4 border-l-4 border-[#254642]">
        Nuestras categorías
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Large Mate */}
        <Link 
          href="/shop?category=mate"
          className="col-span-1 lg:col-span-2 row-span-2 relative aspect-[4/5] md:aspect-square overflow-hidden group shadow-lg rounded-2xl cursor-pointer"
        >
          <Image 
            src={categories.mate} 
            alt="Mate" 
            fill 
            className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" 
            sizes="(max-width: 768px) 50vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-6 md:pb-12 p-3 rounded-2xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 md:px-10 py-2 md:py-4 rounded-xl text-white text-sm md:text-2xl font-bold tracking-wider shadow-2xl transform transition-all group-hover:bg-white/20">
              Mates
            </div>
          </div>
        </Link>
        
        {/* Bombilla */}
        <Link 
          href="/shop?category=bombilla"
          className="relative aspect-square overflow-hidden group shadow-md rounded-2xl cursor-pointer"
        >
          <Image 
            src={categories.bombilla} 
            alt="Bombilla" 
            fill 
            className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" 
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-4 md:pb-8 p-3 rounded-2xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 md:px-8 py-2 md:py-3 rounded-xl text-white text-xs md:text-lg font-semibold tracking-wide shadow-xl transform transition-all group-hover:bg-white/20 text-center">
              Bombillas
            </div>
          </div>
        </Link>
        
        {/* Accesorios */}
        <Link 
          href="/shop?category=accesorio"
          className="relative aspect-square overflow-hidden group shadow-md rounded-2xl cursor-pointer"
        >
          <Image 
            src={categories.accesorios} 
            alt="Accesorios" 
            fill 
            className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105" 
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-4 md:pb-8 p-3 rounded-2xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 md:px-8 py-2 md:py-3 rounded-xl text-white text-xs md:text-lg font-semibold tracking-wide shadow-xl transform transition-all group-hover:bg-white/20 text-center">
              Accesorios
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
