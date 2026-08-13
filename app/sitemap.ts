import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

async function getProducts() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('Failed to fetch products for sitemap, status:', res.status);
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object' && Array.isArray(data.content)) {
      return data.content;
    }

    console.warn('Unexpected products data format:', data);
    return [];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.content)) return data.content;
    return [];
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  // Static routes with priorities
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Category routes (clean URLs)
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat: any) => ({
    url: `${baseUrl}/shop?category=${cat.description?.toLowerCase() || cat.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Product routes
  const productRoutes: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${baseUrl}/producto/${product.slug || product.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
