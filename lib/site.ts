export const SITE_URL = 'https://www.purosmates.com.ar';

/**
 * Single source of truth for the canonical site URL.
 * Precedence: explicit env var > Vercel production URL > Vercel deployment URL > production domain.
 * The final fallback MUST be the real domain so canonical URLs, JSON-LD and
 * the sitemap never resolve to localhost in production.
 */
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : SITE_URL)
  );
}
