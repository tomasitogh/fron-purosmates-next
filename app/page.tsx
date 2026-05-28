
import { Suspense } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';
import { getBanners, getHomeImages, getTestimonials } from '@/lib/actions/home.actions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Puros Mates - Tienda Online de Mates y Accesorios Premium',
  description: 'Descubre los mejores mates artesanales, bombillas y accesorios en Puros Mates. Envíos a todo el país. Calidad premium garantizada.',
  openGraph: {
    title: 'Puros Mates - Tienda Online de Mates y Accesorios Premium',
    description: 'Los mejores mates artesanales de Argentina.',
    images: ['/opengraph-image'],
  },
};

export default async function HomePage() {
  const [bannersData, homeImagesData, testimonialsData] = await Promise.all([
    getBanners(),
    getHomeImages(),
    getTestimonials()
  ]);
  
  const banners = bannersData.length > 0 
    ? bannersData.map((b: any) => ({ src: b.imageUrl, alt: b.altText || 'Banner Puros Mates', link: b.link }))
    : [];
  
  const dynamicCategories = homeImagesData.length > 0
    ? homeImagesData
    : null;

  const testimonials = testimonialsData;

  return (
    <div className="flex flex-col w-full">
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">Puros Mates - Tienda de Mates Artesanales y Accesorios en Argentina</h1>
      
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#254642]">Cargando experiencia matera...</div>}>
        {/* Hero Carousel */}
        <HeroCarousel images={banners} />
        {/* Category Grid */}
        <CategoryGrid categories={dynamicCategories} />
        {/* Testimonials */}
        <div className="bg-gray-50">
          <Testimonials data={testimonials} />
        </div>
      </Suspense>
    </div>
  );
}
