export interface Comparison {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  /** Dos frases que se entienden solas: es lo que copian los buscadores y las IA. */
  summary: string;
  rows: { aspect: string; us: string; them: string }[];
  whereTheyWin: string[];
  whereWeWin: string[];
  faqs: { question: string; answer: string }[];
}

export const COMPARISONS_VERIFIED_NOTE =
  'Comparación basada en información pública y en características generales de cada tipo de vendedor. Verificá precios, plazos y condiciones vigentes directamente con cada tienda.';

export const COMPARISONS: Comparison[] = [
  {
    slug: 'puros-mates-vs-mercadolibre',
    competitor: 'Mercado Libre',
    title: 'Puros Mates vs Mercado Libre: ¿dónde comprar un mate?',
    description:
      'Comparamos comprar un mate en Puros Mates o en Mercado Libre: personalización, atención, garantías y envío.',
    summary:
      'Puros Mates es una tienda especializada en mates artesanales argentinos con grabado personalizado en la virola. Mercado Libre es un marketplace con miles de vendedores, ideal para comparar precios y pagar en cuotas.',
    rows: [
      {
        aspect: 'Tipo de vendedor',
        us: 'Tienda especializada en mates',
        them: 'Marketplace con múltiples vendedores',
      },
      {
        aspect: 'Personalización',
        us: 'Grabado en virola, materas, bombillas y yerberos (en modelos que lo permiten)',
        them: 'Depende de cada vendedor',
      },
      {
        aspect: 'Atención',
        us: 'Contacto directo por WhatsApp para coordinar pedido y grabado',
        them: 'Mensajería de la plataforma con cada vendedor',
      },
      {
        aspect: 'Regalos empresariales',
        us: 'Proyectos con logo y cotización',
        them: 'Varía según el vendedor',
      },
      {
        aspect: 'Envío',
        us: 'A todo el país; gratis en Canning',
        them: 'Amplia cobertura logística de la plataforma',
      },
    ],
    whereTheyWin: [
      'Mayor variedad total de vendedores y precios para comparar.',
      'Protección al comprador y opciones de cuotas propias de la plataforma.',
    ],
    whereWeWin: [
      'Catálogo curado y atención directa de una tienda especializada.',
      'Personalización y proyectos empresariales coordinados con la misma tienda.',
    ],
    faqs: [
      {
        question: '¿Es mejor comprar un mate en Mercado Libre o en una tienda propia?',
        answer:
          'Depende de lo que busques: Mercado Libre ofrece variedad y protección de la plataforma; una tienda especializada como Puros Mates ofrece catálogo curado, personalización y atención directa.',
      },
    ],
  },
  {
    slug: 'puros-mates-vs-imperio-verde',
    competitor: 'Imperio Verde',
    title: 'Puros Mates vs Imperio Verde: mates artesanales comparados',
    description:
      'Dos tiendas de mates artesanales argentinos: qué ofrece cada una en diseño, personalización y envíos.',
    summary:
      'Puros Mates es una tienda de mates artesanales de Canning, Buenos Aires, con personalizador online de virolas. Imperio Verde es un emprendimiento cordobés de mates artesanales con virolas de metal cincelado a mano.',
    rows: [
      { aspect: 'Origen', us: 'Canning, Buenos Aires', them: 'Córdoba' },
      {
        aspect: 'Especialidad',
        us: 'Catálogo amplio de mates, bombillas y accesorios',
        them: 'Mates con virolas cinceladas a mano',
      },
      {
        aspect: 'Personalizador online',
        us: 'Sí, diseñador de virola en la web',
        them: 'Según su sitio; consultá con la tienda',
      },
      { aspect: 'Regalos empresariales', us: 'Sí, con cotización', them: 'Consultá con la tienda' },
    ],
    whereTheyWin: ['Trabajo de cincelado artesanal como sello distintivo.'],
    whereWeWin: [
      'Personalizador online y catálogo más amplio de accesorios.',
      'Proyectos de regalos empresariales.',
    ],
    faqs: [
      {
        question: '¿Cuál conviene si quiero un mate cincelado?',
        answer:
          'Si el cincelado a mano es lo central, Imperio Verde es una opción a mirar; si querés diseñar tu propia virola online, Puros Mates tiene personalizador.',
      },
    ],
  },
  {
    slug: 'puros-mates-vs-dedicar',
    competitor: 'Dedicar',
    title: 'Puros Mates vs Dedicar: regalos personalizados con mate',
    description:
      'Comparamos Puros Mates y Dedicar para regalos personalizados y empresariales con mates.',
    summary:
      'Puros Mates se especializa en mates y accesorios con grabado personalizado y regalos empresariales. Dedicar es una empresa de regalos personalizados y merchandising con una línea de mates entre muchos otros productos.',
    rows: [
      {
        aspect: 'Enfoque',
        us: 'Especialistas en mates',
        them: 'Regalos y merchandising en general',
      },
      {
        aspect: 'Rubros',
        us: 'Mates, bombillas, yerberos, accesorios',
        them: 'Amplia gama de regalos, con línea de mates',
      },
      {
        aspect: 'Regalos empresariales',
        us: 'Mates con logo grabado en virola',
        them: 'Merchandising variado para empresas',
      },
    ],
    whereTheyWin: [
      'Si necesitás un kit con productos de varios rubros, un proveedor de merchandising general puede resolverlo todo junto.',
    ],
    whereWeWin: ['Conocimiento específico de mates y modelos pensados para grabado.'],
    faqs: [
      {
        question: '¿Qué conviene para un regalo corporativo con mate?',
        answer:
          'Si el mate es el protagonista, una tienda especializada; si es parte de un kit con otros productos, un proveedor de merchandising general.',
      },
    ],
  },
];

export function getComparison(slug: string) {
  return COMPARISONS.find((c) => c.slug === slug);
}
