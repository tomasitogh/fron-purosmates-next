import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site';
import { getAllPosts } from '@/lib/blog';
import { COMPARISONS } from '@/lib/comparisons';

// Rebuild the sitemap at most once per hour instead of on every request/crawl
export const revalidate = 3600;

const baseUrl = getBaseUrl();

// Fecha fija: reportar `new Date()` en cada build le dice a Google que todo cambió siempre
// y termina ignorando <lastmod>. Actualizar solo cuando cambie el contenido de esas páginas.
const STATIC_LAST_MODIFIED = new Date('2026-10-31');

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
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/regalos-empresariales`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rincon-matero`,
      lastModified: STATIC_LAST_MODIFIED,
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

  const blogRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...getAllPosts().map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified ?? post.datePublished),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  const comparisonRoutes: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${baseUrl}/comparar/${c.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...comparisonRoutes, ...productRoutes];
}
