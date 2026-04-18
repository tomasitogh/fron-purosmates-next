
import { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Puros Mates - Tienda Online de Mates y Accesorios Premium',
  description: 'Descubre los mejores mates artesanales, bombillas y accesorios en Puros Mates. Envíos a todo el país. Calidad premium garantizada.',
  openGraph: {
    title: 'Puros Mates - Tienda Online de Mates y Accesorios Premium',
    description: 'Los mejores mates artesanales de Argentina.',
    images: ['/logo-purosmates.png'],
  },
};

// Server Component: load config JSON
async function getHomeConfig() {
  const configPath = path.join(process.cwd(), 'public', 'homeConfig.json');
  const data = await fs.promises.readFile(configPath, 'utf8');
  return JSON.parse(data);
}

export default async function HomePage() {
  const config = await getHomeConfig();
  const { banners, categories, testimonials } = config;

  return (
    <div className="flex flex-col w-full">
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">Puros Mates - Tienda de Mates Artesanales y Accesorios en Argentina</h1>
      
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#254642]">Cargando experiencia matera...</div>}>
        {/* Hero Carousel */}
        <HeroCarousel images={banners} />
        {/* Category Grid */}
        <CategoryGrid categories={categories} />
        {/* Testimonials */}
        <div className="bg-gray-50">
          <Testimonials data={testimonials} />
        </div>
      </Suspense>
    </div>
  );
}
