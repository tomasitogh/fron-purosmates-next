import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site';

// Rebuild the sitemap at most once per hour instead of on every request/crawl
export const revalidate = 3600;

const baseUrl = getBaseUrl();

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/regalos-empresariales`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rincon-matero`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Product routes — only canonical, indexable URLs.
  // Note: /shop?category=... variants are intentionally excluded because they
  // render the same server HTML as /shop (filtering is client-side), so they
  // are duplicate content and must not be submitted to Google.
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((product: any) => product?.slug || product?.id)
    .map((product: any) => {
      const lastModified = product.updatedAt || product.createdAt;

      return {
        url: `${baseUrl}/producto/${product.slug || product.id}`,
        ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

  return [...staticRoutes, ...productRoutes];
}
