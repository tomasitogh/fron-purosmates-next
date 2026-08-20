import { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site';
import { getCorporateProjects } from '@/lib/data/home';
import CorporateGiftsForm from '@/components/CorporateGiftsForm';
import CorporateGiftsGallery from '@/components/CorporateGiftsGallery';
import {
  Package,
  MessageCircle,
  Palette,
  Truck,
  CheckCircle2,
  Shield,
  Clock,
  Award,
} from 'lucide-react';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Regalos Empresariales y Mates Personalizados | Puros Mates',
  description:
    'Regalos empresariales originales y de calidad. Mates personalizados con logo grabado a láser, packaging premium y envíos a todo el país. Cotizá online.',
  openGraph: {
    title: 'Regalos Empresariales y Mates Personalizados | Puros Mates',
    description:
      'Regalos empresariales originales y de calidad. Mates personalizados con logo grabado a láser, packaging premium y envíos a todo el país. Cotizá online.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
    url: `${baseUrl}/regalos-empresariales`,
  },
  alternates: {
    canonical: `${baseUrl}/regalos-empresariales`,
  },
};

const steps = [
  {
    icon: MessageCircle,
    title: 'Asesoramiento y Cotización',
    description: 'Completás el formulario con tu idea, cantidades y fecha requerida.',
  },
  {
    icon: Palette,
    title: 'Muestra Digital (Mockup)',
    description:
      'Te enviamos una muestra digital de cómo quedará tu logo en el mate antes de producir.',
  },
  {
    icon: CheckCircle2,
    title: 'Producción y Grabado Láser',
    description: 'Fabricamos y grabamos cada unidad cuidando cada detalle de terminación.',
  },
  {
    icon: Truck,
    title: 'Control de Calidad y Entrega',
    description: 'Revisamos el pedido, embalamos con packaging premium y despachamos a destino.',
  },
];

const benefits = [
  {
    icon: Shield,
    title: 'Calidad Artesanal Garantizada',
    description: 'Mates seleccionados de primera calidad, curados y listos para usar.',
  },
  {
    icon: Award,
    title: 'Grabado Láser de Alta Precisión',
    description:
      'Personalización de logos, frases y nombres en virola o cuerpo con máxima durabilidad.',
  },
  {
    icon: Package,
    title: 'Packaging Corporativo Premium',
    description:
      'Presentación lista para entregar con cajas, fajas personalizadas y tarjetas dedicadas.',
  },
  {
    icon: Truck,
    title: 'Logística y Entregas Puntuales',
    description:
      'Planificación estricta de fechas de entrega y envíos a todo el país con seguimiento.',
  },
];

const faqs = [
  {
    q: '¿Cuál es el pedido mínimo para regalos corporativos?',
    a: 'Trabajamos pedidos corporativos a partir de 50 unidades personalizadas.',
  },
  {
    q: '¿Cómo se realiza el grabado del logo?',
    a: 'Utilizamos tecnología de grabado láser de alta precisión sobre la virola metálica o sobre el cuero, logrando un acabado permanente e inalterable.',
  },
  {
    q: '¿Hacen envíos a todo el país?',
    a: 'Sí, realizamos envíos seguros y coordinados a cualquier punto de Argentina.',
  },
  {
    q: '¿Cuánto demora la producción y entrega?',
    a: 'La producción demora aproximadamente 15 días hábiles una vez aprobado el diseño digital.',
  },
];

export default async function CorporateGiftsPage() {
  const projects = await getCorporateProjects();
  const galleryItems = projects.map((project) => ({
    image: project.imageUrl,
    alt: `Regalo empresarial personalizado para ${project.title}`,
    client: project.title,
    description: project.description,
  }));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Regalos Empresariales',
        item: `${baseUrl}/regalos-empresariales`,
      },
    ],
  };

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Regalos Empresariales Puros Mates',
    description:
      'Regalos empresariales originales y de calidad. Mates personalizados con logo grabado a láser, packaging premium y envíos a todo el país. Cotizá online.',
    provider: {
      '@type': 'Organization',
      name: 'Puros Mates',
      url: baseUrl,
    },
    areaServed: 'AR',
    serviceType: 'Regalos Empresariales',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuál es el pedido mínimo para regalos corporativos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Trabajamos pedidos corporativos a partir de 50 unidades personalizadas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo se realiza el grabado del logo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Utilizamos tecnología de grabado láser de alta precisión sobre la virola metálica o sobre el cuero, logrando un acabado permanente e inalterable.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hacen envíos a todo el país?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, realizamos envíos seguros y coordinados a cualquier punto de Argentina.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto demora la producción y entrega?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La producción demora aproximadamente 15 días hábiles una vez aprobado el diseño digital.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#254642] via-[#1f4339] to-[#1C3632] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="mb-4 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-medium text-[#D4AF37]">
            Regalos Empresariales
          </span>
          <h1 className="mb-6 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            Regalos Empresariales:{' '}
            <span className="text-[#D4AF37]">Mates Personalizados con tu Marca</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Creamos kits y mates artesanales con grabado láser de alta precisión. La opción perfecta
            para fin de año, onboarding, eventos corporativos y fidelización de clientes.
          </p>
          <a
            href="#formulario-presupuesto"
            className="inline-block rounded-lg bg-[#D4AF37] px-8 py-3.5 text-lg font-semibold text-[#254642] shadow-lg transition-all hover:bg-[#DAA520] hover:shadow-xl"
          >
            Pedir cotización online
          </a>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-gray-100 bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-4 text-sm text-gray-600 sm:gap-12">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#254642]" />
            <span>Personalización con logo</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[#254642]" />
            <span>Envíos a todo el país</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#254642]" />
            <span>Presupuesto en 24 hs</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#254642]" />
            <span>Calidad garantizada</span>
          </div>
        </div>
      </section>

      {/* Trabajos Realizados */}
      <section className="bg-[#F5F2E9] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#254642] sm:text-4xl">
            Proyectos y Marcas que Confían en Nosotros
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
            Casos reales de regalos corporativos y merchandising premium.
          </p>
          <CorporateGiftsGallery items={galleryItems} />
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#254642] sm:text-4xl">
            ¿Por qué Elegir Mates Personalizados para tu Empresa?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
            Un regalo con identidad, durabilidad y uso cotidiano que conecta con tu equipo y
            clientes.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl bg-[#F5F2E9] p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#254642]/10">
                  <benefit.icon className="h-7 w-7 text-[#254642]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#254642]">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="bg-[#F5F2E9] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#254642] sm:text-4xl">
            Cómo Funciona el Proceso de Pedido
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
            Simple, transparente y con seguimiento constante paso a paso.
          </p>
          <div className="relative">
            {/* Line connector */}
            <div className="absolute top-0 left-4 hidden h-full w-0.5 bg-[#D4AF37]/30 sm:left-1/2 sm:block" />
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={step.title}
                    className={`relative flex flex-col items-center gap-4 sm:flex-row ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                  >
                    <div
                      className={`flex w-full flex-col items-center text-center sm:w-1/2 ${isEven ? 'sm:pr-12 sm:text-right' : 'sm:pl-12 sm:text-left'}`}
                    >
                      <h3 className="mb-2 text-xl font-bold text-[#254642]">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                    <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-[#D4AF37] bg-[#254642] text-white shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="hidden w-1/2 sm:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de presupuesto */}
      <section
        id="formulario-presupuesto"
        className="bg-gradient-to-br from-[#254642] via-[#1f4339] to-[#1C3632] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
            Solicitá tu Presupuesto Corporativo
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-white/70">
            Completá los datos y te enviamos la propuesta personalizada en menos de 24 horas.
          </p>
          <CorporateGiftsForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#254642] sm:text-4xl">
            Preguntas Frecuentes sobre Regalos Empresariales
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-gray-200 bg-white p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-[#254642]">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
