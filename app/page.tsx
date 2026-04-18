
import { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inicio',
  description: 'Descubre los mejores mates y accesorios en Puros Mates.',
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      {/* Hero Carousel */}
      <HeroCarousel images={banners} />
      {/* Category Grid */}
      <CategoryGrid categories={categories} />
      {/* Testimonials */}
      <Testimonials data={testimonials} />
    </Suspense>
  );
}
