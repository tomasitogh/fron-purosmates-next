import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.purosmates.com.ar';

async function getProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/slug/${slug}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return { title: 'Producto no encontrado | Puros Mates' };
  }

  const imageUrl = product.images?.[0]?.url || '/logo-purosmates.png';
  const description =
    product.description?.slice(0, 160) || `${product.name} - Compra en Puros Mates`;

  return {
    title: `${product.name} | Puros Mates`,
    description,
    openGraph: {
      title: `${product.name} | Puros Mates`,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
      type: 'website',
      locale: 'es_AR',
      siteName: 'Puros Mates',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Puros Mates`,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/producto/${resolvedParams.slug}`,
    },
  };
}

function ProductJsonLd({ product, slug }: { product: any; slug: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Puros Mates`,
    image: product.images?.map((img: any) => img.url) || [],
    url: `${baseUrl}/producto/${slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Puros Mates',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/producto/${slug}`,
      priceCurrency: 'ARS',
      price: product.price,
      availability:
        (product.totalStock ?? product.stock) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Puros Mates',
      },
    },
    category: product.category?.description || 'Mates',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function BreadcrumbJsonLd({ productName, slug }: { productName: string; slug: string }) {
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
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tienda',
        item: `${baseUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: productName,
        item: `${baseUrl}/producto/${slug}`,
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

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const slug = resolvedParams.slug;
  const mainImage = product.images?.[0];

  return (
    <>
      <ProductJsonLd product={product} slug={slug} />
      <BreadcrumbJsonLd productName={product.name} slug={slug} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb visible */}
        <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="transition hover:text-[#254642]">
                Inicio
              </Link>
            </li>
            <li className="before:mx-2 before:text-gray-300 before:content-['/']">
              <Link href="/shop" className="transition hover:text-[#254642]">
                Tienda
              </Link>
            </li>
            {product.category?.description && (
              <li className="before:mx-2 before:text-gray-300 before:content-['/']">
                <Link
                  href={`/shop?category=${product.category.description.toLowerCase()}`}
                  className="transition hover:text-[#254642]"
                >
                  {product.category.description}
                </Link>
              </li>
            )}
            <li className="before:mx-2 before:text-gray-300 before:content-['/']">
              <span className="text-gray-900">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Imagen */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{product.name}</h1>

            {product.category?.description && (
              <p className="mt-2 text-sm font-medium tracking-wide text-[#254642] uppercase">
                {product.category.description}
              </p>
            )}

            <div className="mt-6">
              <span className="text-4xl font-black text-[#254642]">
                ${product.price?.toLocaleString('es-AR')}
              </span>
            </div>

            {(product.totalStock ?? product.stock) > 0 ? (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                En stock
              </span>
            ) : (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                Sin stock
              </span>
            )}

            {product.description && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Descripción
                </h2>
                <p className="leading-relaxed text-gray-600">{product.description}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-auto pt-8">
              <ProductPageClient params={Promise.resolve({ slug })} productName={product.name} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
