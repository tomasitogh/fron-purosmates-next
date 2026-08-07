import { Suspense } from 'react';
import ShopContent from '@/app/ShopContent';

export const revalidate = 60;

export const metadata = {
  title: 'Catálogo de Productos - Puros Mates',
  description:
    'Explora nuestra amplia variedad de mates, bombillas y accesorios artesanales. Elige la mejor calidad para tu set matero.',
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error('Failed to fetch products');
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      console.error('Failed to fetch categories');
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function ShopPage() {
  const [products, categoriesData] = await Promise.all([getProducts(), getCategories()]);
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData && Array.isArray(categoriesData.content)
      ? categoriesData.content
      : [];

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[#254642]">
          Cargando productos...
        </div>
      }
    >
      <ShopContent initialProducts={products} initialCategories={categories} />
    </Suspense>
  );
}
