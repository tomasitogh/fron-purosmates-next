import ShopContent from '@/app/ShopContent';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tienda',
  description: 'Catálogo de productos de Puros Mates',
};

export default async function ShopPage() {
  // Reuse the data fetching logic from the previous home page
  async function getProducts() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/products`, {
        next: { revalidate: 10 },
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
      const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/categories`, {
        next: { revalidate: 10 },
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

  const [products, categoriesData] = await Promise.all([getProducts(), getCategories()]);
  const categories = Array.isArray(categoriesData)
    ? categoriesData
    : categoriesData && Array.isArray(categoriesData.content)
    ? categoriesData.content
    : [];

  return <ShopContent initialProducts={products} initialCategories={categories} />;
}
