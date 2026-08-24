import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';
import FeaturedProducts, { cloudinaryUrl } from '@/components/FeaturedProducts';
import Testimonials from '@/components/Testimonials';
import { getBanners, getFeaturedProducts, getHomeImages, getTestimonials } from '@/lib/data/home';
import type { FeaturedProduct } from '@/lib/data/home';
import { getBaseUrl } from '@/lib/site';

export const revalidate = 60;

const baseUrl = getBaseUrl();

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
    canonical: baseUrl,
  },
};

function StoreJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Puros Mates',
    url: baseUrl,
    logo: `${baseUrl}/logo-purosmates.png`,
    image: `${baseUrl}/logo-purosmates.png`,
    telephone: '+5491130548207',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Canning',
      addressRegion: 'Buenos Aires',
      addressCountry: 'AR',
    },
    sameAs: ['https://www.instagram.com/puros.mates/', 'https://wa.me/5491130548207'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function BreadcrumbJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: baseUrl,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function FeaturedProductsJsonLd({ products }: { products: FeaturedProduct[] }) {
  if (!Array.isArray(products) || products.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Productos destacados de Puros Mates',
    itemListElement: products.map((product, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${baseUrl}/producto/${product.slug || product.id}`,
      name: product.name,
      image: product.image?.url ? cloudinaryUrl(product.image.url, 640) : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

const valueProps = [
  {
    title: 'Hecho por artesanos',
    description:
      'Cada mate sale de las manos de artesanos locales que trabajan calabaza, algarrobo y alpaca seleccionada.',
  },
  {
    title: 'Envíos a todo el país',
    description:
      'Despachamos por Correo Argentino Paq.ar o el servicio que vos prefieras. Envío gratis en Canning y alrededores.',
  },
  {
    title: 'Personalización con láser',
    description: 'Grabamos tu nombre, frase o diseño en la virola de tu mate para que sea único.',
  },
];

export default async function HomePage() {
  const [bannersData, homeImagesData, testimonials, featuredProducts] = await Promise.all([
    getBanners(),
    getHomeImages(),
    getTestimonials(),
    getFeaturedProducts(),
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
      <StoreJsonLd />
      <BreadcrumbJsonLd />
      <FeaturedProductsJsonLd products={featuredProducts} />

      {/* Hero Carousel */}
      <HeroCarousel images={banners} />

      {/* Intro - Texto visible para usuarios y SEO */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 text-center md:py-16">
        <p className="mb-3 text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
          Mates artesanales argentinos
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
          Mates Artesanales y Accesorios para acompañarte cada día
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
          En <strong>Puros Mates</strong> trabajamos para alcanzarte los mejores mates al mejor
          precio. Tenemos gran variedad y una calidad que habla por si sola. También vas a encontrar
          bombillas, bombillones y accesorios para completar tu set matero, con grabado láser
          personalizado y envíos a todo el país por Correo Argentino.
        </p>
        <div className="mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#254642] px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#254642]/20 transition-transform hover:scale-[1.03] hover:bg-[#1d3936]"
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
              className="h-5 w-5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {valueProps.map((prop) => (
            <li key={prop.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#254642]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-[#D4AF37]"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {prop.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{prop.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Category Grid */}
      <CategoryGrid categories={dynamicCategories} />

      {/* Productos destacados */}
      <FeaturedProducts products={featuredProducts} />

      {/* Testimonials */}
      <div className="bg-gray-50">
        <Testimonials data={testimonials} />
      </div>
    </div>
  );
}
