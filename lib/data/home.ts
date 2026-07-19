import type { Banner, HomeImage, Testimonial } from '@/lib/actions/home.actions';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
