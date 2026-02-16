import { MetadataRoute } from 'next';

// Force dynamic generation
export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ? process.env.NEXT_PUBLIC_BASE_URL
    : (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

async function getProducts() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const res = await fetch(`${API_URL}/products`, {
            next: { revalidate: 3600 } // Revalidate every hour
        });

        if (!res.ok) {
            console.error('Failed to fetch products for sitemap, status:', res.status);
            return [];
        }

        const data = await res.json();

        // Handle both array and paginated response
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
    const routes = [
        '',
        '/carrito',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // Product routes
    const productRoutes = products.map((product: any) => ({
        url: `${baseUrl}/producto/${product.slug || product.id}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...routes, ...productRoutes];
}
