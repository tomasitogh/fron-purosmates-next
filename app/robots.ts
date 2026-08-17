import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/checkout/',
          '/compra-exitosa/',
          '/carrito/',
          '/customize/',
          '/api/',
          '/test-editor/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
