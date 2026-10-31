import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

const DISALLOWED = [
  '/admin/',
  '/checkout/',
  '/compra-exitosa/',
  '/carrito/',
  '/favoritos/',
  '/perfil/',
  '/customize/',
  '/api/',
  '/test-editor/',
];

// Bots de IA (entrenamiento, búsqueda y navegación por pedido del usuario).
// Se listan explícitamente para que quede documentado que son bienvenidos.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED },
      { userAgent: AI_BOTS, allow: '/', disallow: DISALLOWED },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
