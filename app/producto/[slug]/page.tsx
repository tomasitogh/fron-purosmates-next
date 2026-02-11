import { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Función para obtener producto del backend (solo para metadata)
async function getProductBySlug(slug: string) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${API_URL}/products/slug/${slug}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Generar metadata para SEO y Open Graph
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | Puros Mates',
    };
  }

  const imageUrl = product.images?.[0]?.url || '/logo-purosmates.png';
  const description = product.description || `${product.name} - Compra en Puros Mates`;

  return {
    title: `${product.name} | Puros Mates`,
    description: description,
    openGraph: {
      title: `${product.name} | Puros Mates`,
      description: description,
      images: [imageUrl],
      type: 'website',
      locale: 'es_AR',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Puros Mates`,
      description: description,
      images: [imageUrl],
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return <ProductPageClient params={params} />;
}
