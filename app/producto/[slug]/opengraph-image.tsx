import { ImageResponse } from 'next/og';
import { join } from 'path';
import { readFile } from 'fs/promises';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const alt = 'Puros Mates';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Interface for Product (simplified for what we need)
interface Product {
    name: string;
    price: number;
    description: string;
    category: { description: string };
    images: { url: string }[];
}

async function getProduct(slug: string): Promise<Product | null> {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        // Ensure API_URL is valid for server-side fetching
        // If running in Docker or specific environments, localhost might need adjustment
        // But for standard Next.js dev/prod, it should work if the backend is accessible.

        console.log(`Fetching product for OG: ${API_URL}/products/slug/${slug}`);
        const res = await fetch(`${API_URL}/products/slug/${slug}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            console.error(`Failed to fetch product: ${res.status}`);
            return null;
        }
        return res.json();
    } catch (error) {
        console.error('Error fetching product for OG image:', error);
        return null;
    }
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const product = await getProduct(slug);

    // Font loading
    const interSemiBold = await fetch(
        new URL('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-600-normal.woff', import.meta.url)
    ).then((res) => res.arrayBuffer());

    const interBold = await fetch(
        new URL('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-800-normal.woff', import.meta.url)
    ).then((res) => res.arrayBuffer());

    // Load Logo for fallback or branding
    let logoSrc: ArrayBuffer | null = null;
    try {
        const logoData = await readFile(join(process.cwd(), 'public/logo-purosmates.png'));
        logoSrc = Uint8Array.from(logoData).buffer;
    } catch (e) {
        console.error('Failed to load logo', e);
    }

    if (!product) {
        // Fallback if product not found
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 60,
                        background: '#2d5d52',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F5F5DC',
                        fontFamily: '"Inter"',
                        fontWeight: 800
                    }}
                >
                    {logoSrc && (
                        /* @ts-ignore */
                        <img src={logoSrc} width="120" height="120" style={{ marginBottom: 20, borderRadius: '50%', backgroundColor: 'white', padding: '10px' }} />
                    )}
                    <div>PUROS MATES</div>
                    <div style={{ fontSize: 30, fontWeight: 600, marginTop: 10, color: '#F5F5DC' }}>Producto no encontrado</div>
                </div>
            ),
            { ...size, fonts: [{ name: 'Inter', data: interBold, weight: 800, style: 'normal' }] }
        );
    }

    let productImage = product.images && product.images.length > 0 ? product.images[0].url : null;

    // Fix for Cloudinary WebP images in OG generation (not always supported)
    // We force the extension to be .jpg which Cloudinary handles dynamically
    if (productImage && productImage.includes('cloudinary.com') && productImage.endsWith('.webp')) {
        productImage = productImage.replace('.webp', '.jpg');
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#2d5d52',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                {/* Left Side: Detail & Branding */}
                <div style={{
                    width: '50%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between', // Distribute space
                    padding: '60px',
                    backgroundColor: '#2d5d52',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            fontSize: 24,
                            color: '#e2e8f0',
                            fontFamily: '"Inter"',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '10px',
                            fontWeight: 600
                        }}>
                            {product.category?.description || 'Producto'}
                        </div>
                        <div style={{
                            fontSize: 58,
                            fontFamily: '"Inter"',
                            fontWeight: 800,
                            color: '#fff',
                            lineHeight: 1.1,
                            marginBottom: '20px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {product.name}
                        </div>
                        <div style={{
                            fontSize: 52,
                            fontFamily: '"Inter"',
                            fontWeight: 600,
                            color: '#D4AF37', // Gold color
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '10px'
                        }}>
                            <span>${product.price.toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        {logoSrc && (
                            /* @ts-ignore */
                            <img src={logoSrc} width="50" height="50" style={{ borderRadius: '50%', backgroundColor: 'white', padding: '5px' }} />
                        )}
                        <div style={{
                            fontSize: 32,
                            color: '#F5F5DC',
                            fontFamily: '"Inter"',
                            fontWeight: 600
                        }}>
                            PUROS MATES
                        </div>
                    </div>
                </div>

                {/* Right Side: Image */}
                <div style={{
                    width: '50%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    padding: '20px'
                }}>
                    {productImage ? (
                        /* @ts-ignore */
                        <img
                            src={productImage}
                            alt={product.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <div style={{ fontSize: 40, color: '#ccc', fontFamily: '"Inter"', fontWeight: 600 }}>Sin Imagen</div>
                    )}
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interSemiBold,
                    style: 'normal',
                    weight: 600,
                },
                {
                    name: 'Inter',
                    data: interBold,
                    style: 'normal',
                    weight: 800,
                },
            ],
        }
    );
}
