import type { Product } from '@/components/ProductModal';

export const SAMPLE_CATEGORIES = [
  { id: 2, description: 'Mates', active: true },
  { id: 1, description: 'Bombillas', active: true },
  { id: 6, description: 'Accesorios', active: true },
];

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Mate Imperial Premium de Calabaza',
    slug: 'mate-imperial-premium-calabaza',
    price: 42000,
    stock: 15,
    totalStock: 15,
    description:
      'Mate Imperial seleccionado a mano. Confeccionado en calabaza brasilera de paredes gruesas, forrado en cuero vacuno legítimo de primera calidad y terminado con virola de alpaca cincelada artesanalmente. Apto para grabado láser personalizado.',
    isCustomizable: true,
    customizationCost: 28000,
    category: { id: 2, description: 'Mates' },
    images: [{ url: '/categories/mate.jpg' }],
    variants: [
      {
        id: 101,
        sku: 'MATE-IMP-ALPACA',
        name: 'Virola de Alpaca Cincelada',
        stock: 10,
        active: true,
        imageUrl: '/categories/mate.jpg',
      },
      {
        id: 102,
        sku: 'MATE-IMP-LISA',
        name: 'Virola Lisa de Acero',
        stock: 5,
        active: true,
        imageUrl: '/categories/mate.jpg',
      },
    ],
  },
  {
    id: 2,
    name: 'Mate Camionero Cuero Vacuno',
    slug: 'mate-camionero-cuero-vacuno',
    price: 36000,
    stock: 12,
    totalStock: 12,
    description:
      'El clásico mate camionero uruguayo. Base reforzada de 4 patas, boca ancha ideal para cebar y no mojar la yerba. Virola de acero inoxidable pulido espejo lista para personalizar con tu frase o escudo.',
    isCustomizable: true,
    customizationCost: 28000,
    category: { id: 2, description: 'Mates' },
    images: [{ url: '/categories/mate.jpg' }],
    variants: [
      {
        id: 201,
        sku: 'MATE-CAM-NEGRO',
        name: 'Cuero Negro Clásico',
        stock: 8,
        active: true,
        imageUrl: '/categories/mate.jpg',
      },
      {
        id: 202,
        sku: 'MATE-CAM-MARRON',
        name: 'Cuero Marrón Suela',
        stock: 4,
        active: true,
        imageUrl: '/categories/mate.jpg',
      },
    ],
  },
  {
    id: 3,
    name: 'Bombilla Pico de Loro Alpaca Maciza',
    slug: 'bombilla-pico-de-loro-alpaca',
    price: 14500,
    stock: 30,
    totalStock: 30,
    description:
      'Bombilla tradicional pico de loro elaborada en alpaca maciza. Caño grueso de excelente tiraje, filtro de pala ranurada que no se tapa con ningún tipo de yerba mate.',
    isCustomizable: false,
    category: { id: 1, description: 'Bombillas' },
    images: [{ url: '/categories/bombilla.jpg' }],
    variants: [
      {
        id: 301,
        sku: 'BOMB-PL-01',
        name: 'Alpaca Pulida 19cm',
        stock: 30,
        active: true,
        imageUrl: '/categories/bombilla.jpg',
      },
    ],
  },
  {
    id: 4,
    name: 'Termo Media Manija Acero 1L',
    slug: 'termo-media-manija-acero-1l',
    price: 48000,
    stock: 10,
    totalStock: 10,
    description:
      'Termo de acero inoxidable de doble capa térmica. Conserva agua caliente por más de 24 horas. Pico matero de precisión con flujo continuo y manija rebatible ergonómica.',
    isCustomizable: false,
    category: { id: 6, description: 'Accesorios' },
    images: [{ url: '/categories/accesorios.jpg' }],
    variants: [
      {
        id: 401,
        sku: 'TERMO-MM-01',
        name: 'Acero Inoxidable 1000ml',
        stock: 10,
        active: true,
        imageUrl: '/categories/accesorios.jpg',
      },
    ],
  },
];

export function findSampleProductBySlug(slug: string): Product | undefined {
  return SAMPLE_PRODUCTS.find((p) => p.slug === slug);
}
