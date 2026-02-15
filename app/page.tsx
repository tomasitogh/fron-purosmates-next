import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import ShopContent from './ShopContent';

// Make this page dynamic to allow useSearchParams in ShopContent
export const dynamic = 'force-dynamic';

// Server Component - Fetch products server-side
async function getProducts() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 120 } // ISR: revalidate every 5 minutes
    });

    if (!res.ok) {
      console.error('Failed to fetch products');
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 300 } // ISR: revalidate every 5 minutes
    });

    if (!res.ok) {
      console.error('Failed to fetch categories');
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function HomePage() {
  const [products, categoriesData] = await Promise.all([
    getProducts(),
    getCategories()
  ]);

  // Handle paginated response structure { content: [...], ... } or fallback to array
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : (categoriesData && Array.isArray(categoriesData.content))
      ? categoriesData.content
      : [];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
          <ShopContent initialProducts={products} initialCategories={categories} />
        </Suspense>
      </main>
    </div>
  );
}
