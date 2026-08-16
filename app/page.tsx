import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';
import { getBanners, getHomeImages, getTestimonials } from '@/lib/data/home';

export const revalidate = 60;

export const metadata = {
  title: 'Puros Mates - Comprar Mates Artesanales Online | Envíos a Todo el País',
  description:
    'Tienda online de mates artesanales argentinos. Mates de calabaza, madera, alpaca y más. Bombillas y accesorios. Envíos a todo el país. Envío gratis en Canning.',
  keywords: [
    'comprar mates',
    'mates artesanales',
    'mates argentinos',
    'tienda de mates',
    'mates online',
    'bombillas',
    'accesorios para mate',
    'mate de calabaza',
    'mate de madera',
    'envío mates argentina',
  ],
  openGraph: {
    title: 'Puros Mates - Comprar Mates Artesanales Online',
    description: 'Los mejores mates artesanales de Argentina. Envíos a todo el país.',
    images: ['/opengraph-image'],
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
  },
  alternates: {
    canonical: 'https://www.purosmates.com.ar',
  },
};

export default async function HomePage() {
  const [bannersData, homeImagesData, testimonials] = await Promise.all([
    getBanners(),
    getHomeImages(),
    getTestimonials(),
  ]);

  const banners =
    bannersData.length > 0
      ? bannersData.map((b) => ({
          src: b.imageUrl,
          alt: b.altText || 'Banner Puros Mates - Mates artesanales',
          link: b.link,
        }))
      : [];

  const dynamicCategories = homeImagesData.length > 0 ? homeImagesData : null;

  return (
    <div className="flex w-full flex-col">
      {/* H1 visible for SEO */}
      <h1 className="sr-only text-2xl font-bold md:text-3xl">
        Puros Mates - Tienda de Mates Artesanales y Accesorios en Argentina
      </h1>

      {/* Hero Carousel */}
      <HeroCarousel images={banners} />

      {/* Intro Section - Hidden text for SEO crawlers */}
      <section className="sr-only">
        <div className="mx-auto max-w-4xl">
          <p className="text-lg text-gray-600">
            En <strong>Puros Mates</strong> encontrarás los mejores mates artesanales de Argentina.
            Trabajamos con artesanos locales para ofrecerte mates de calabaza, madera de algarrobo,
            acero inoxidable y alpaca. También contamos con bombillas de various materiales y
            accesorios para completar tu set matero. Envíos a todo el país por Correo Argentino.
          </p>
        </div>
      </section>

      {/* Category Grid */}
      <CategoryGrid categories={dynamicCategories} />

      {/* Testimonials */}
      <div className="bg-gray-50">
        <Testimonials data={testimonials} />
      </div>
    </div>
  );
}
