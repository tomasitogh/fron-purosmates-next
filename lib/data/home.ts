import type { Banner, HomeImage, Testimonial } from '@/lib/actions/home.actions';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface FeaturedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  categoryDescription?: string;
  image?: {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
  };
}

/**
 * Getters del contenido del home con caché de Next.js (ISR).
 * Usan `fetch` nativo para aprovechar la Data Cache: el backend se consulta
 * como máximo una vez cada `revalidate` segundos, no en cada visita.
 */
export async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/banners`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

export async function getHomeImages(): Promise<HomeImage[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/home-images`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching home images:', error);
    return [];
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/testimonials`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

function hasStock(product: any): boolean {
  if (typeof product?.totalStock === 'number') return product.totalStock > 0;
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants.some((v: any) => Number(v?.stock) > 0);
  }
  return Number(product?.stock) > 0;
}

/**
 * Productos destacados de la home. Se sirven desde el servidor ordenados por
 * precio descendente (mayor a menor) y limitados a `limit` productos activos
 * con stock disponible. Se excluyen fuera de stock y variantes con stock 0
 * para que la sección no muestre productos que no se pueden comprar.
 */
export async function getFeaturedProducts(limit = 10): Promise<FeaturedProduct[]> {
  try {
    const res = await fetch(`${API_URL}/products`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

    return products
      .filter((p: any) => p?.active !== false && p && (p.slug || p.id))
      .filter(hasStock)
      .sort((a: any, b: any) => Number(b?.price ?? 0) - Number(a?.price ?? 0))
      .slice(0, limit)
      .map((p: any) => ({
        id: Number(p.id),
        name: p.name ?? '',
        slug: p.slug ?? '',
        price: Number(p.price ?? 0),
        categoryDescription: p.category?.description ?? p.categoryName ?? p.category?.name ?? '',
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : undefined,
      }));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}
