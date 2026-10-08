import { Suspense } from 'react';
import type { Metadata } from 'next';
import ShopContent from '@/app/ShopContent';
import { getBaseUrl } from '@/lib/site';

export const revalidate = 60;

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  // The layout template renders: "Catálogo de Productos | Puros Mates"
  title: 'Catálogo de Productos',
  description:
    'Explora nuestra amplia variedad de mates, bombillas y accesorios artesanales. Elige la mejor calidad para tu set matero.',
  alternates: {
    // Category filtering is client-side: /shop?category=... serves the exact
    // same HTML as /shop, so every query variant must canonicalize to /shop
    canonical: '/shop',
  },
};

import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from '@/lib/data/sampleProducts';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error('Failed to fetch products, using sample products');
      return SAMPLE_PRODUCTS;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return SAMPLE_PRODUCTS;
  } catch (error) {
    console.error('Error fetching products, using sample products:', error);
    return SAMPLE_PRODUCTS;
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error('Failed to fetch categories, using sample categories');
      return SAMPLE_CATEGORIES;
    }
    const data = await res.json();
    const items = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
    if (items.length > 0) {
      const hasPluralAccesorios = items.some(
        (c: any) => (c.description || '').trim().toLowerCase() === 'accesorios'
      );
      if (hasPluralAccesorios) {
        return items.filter((c: any) => (c.description || '').trim().toLowerCase() !== 'accesorio');
      }
      return items;
    }
    return SAMPLE_CATEGORIES;
  } catch (error) {
    console.error('Error fetching categories, using sample categories:', error);
    return SAMPLE_CATEGORIES;
  }
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
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tienda',
        item: `${baseUrl}/shop`,
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

export default async function ShopPage() {
  const [products, categoriesData] = await Promise.all([getProducts(), getCategories()]);
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData as any)?.content && Array.isArray((categoriesData as any).content)
      ? (categoriesData as any).content
      : [];

  return (
    <>
      <BreadcrumbJsonLd />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-[#254642]">
            Cargando productos...
          </div>
        }
      >
        <ShopContent initialProducts={products} initialCategories={categories} />
      </Suspense>
    </>
  );
}
