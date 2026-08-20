import { Metadata } from 'next';
import { getBaseUrl } from '@/lib/site';
import MateRitualGame from '@/components/rincon-matero/MateRitualGame';
import ProductQuizGame from '@/components/rincon-matero/ProductQuizGame';
import MateroPersonalityQuiz from '@/components/rincon-matero/MateroPersonalityQuiz';
import TemperatureCalculator from '@/components/rincon-matero/TemperatureCalculator';
import DecalogoRules from '@/components/rincon-matero/DecalogoRules';
import CuringGuide from '@/components/rincon-matero/CuringGuide';
import MateroBlogFAQ from '@/components/rincon-matero/MateroBlogFAQ';
import { curingGuidesData, materoFaqs } from '@/components/rincon-matero/data';
import { BookOpen, Gamepad2, HelpCircle, Sparkles, Wand2 } from 'lucide-react';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'El Rincón Matero: Guía, Ritual y Cultura del Mate | Puros Mates',
  description:
    'Guía definitiva de curado según el material, preguntas frecuentes sobre la yerba mate, las 10 reglas de la ronda y herramientas interactivas de calibración y juegos.',
  keywords: [
    'como curar un mate',
    'curar mate de calabaza',
    'curar mate de algarrobo',
    'temperatura del agua mate',
    'por que da acidez el mate',
    'reglas del mate',
    'ritual del mate argentino',
    'puros mates blog',
    'calculadora de temperatura mate',
  ],
  openGraph: {
    title: 'El Rincón Matero: Guía, Ritual y Cultura del Mate | Puros Mates',
    description:
      'Guía definitiva de curado, preguntas frecuentes sobre el mate, reglas de la ronda y simulador de temperatura.',
    type: 'article',
    locale: 'es_AR',
    siteName: 'Puros Mates',
    url: `${baseUrl}/rincon-matero`,
  },
  alternates: {
    canonical: `${baseUrl}/rincon-matero`,
  },
};

export default function RinconMateroPage() {
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
        name: 'El Rincón Matero',
        item: `${baseUrl}/rincon-matero`,
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: materoFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo Curar un Mate de Calabaza Tradicional',
    description:
      'Instrucciones paso a paso para curar, sellar poros y acondicionar un mate de calabaza (torpedo, camionero o imperial).',
    totalTime: 'P3D',
    supply: [
      {
        '@type': 'HowToSupply',
        name: 'Yerba mate usada templada',
      },
      {
        '@type': 'HowToSupply',
        name: 'Agua a 75°C - 80°C',
      },
    ],
    tool: [
      {
        '@type': 'HowToTool',
        name: 'Cucharita de té',
      },
      {
        '@type': 'HowToTool',
        name: 'Papel absorbente',
      },
    ],
    step: curingGuidesData[0].steps.map((s) => ({
      '@type': 'HowToStep',
      name: s.title,
      text: s.desc,
      position: s.stepNumber,
    })),
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'El Rincón Matero: Guía, Ritual y Cultura del Mate',
    description:
      'Guía técnica para curar mates según su material, resolución de mitos cotidianos y reglas tradicionales de la ronda de mate.',
    author: {
      '@type': 'Organization',
      name: 'Puros Mates',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Puros Mates',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-purosmates.png`,
      },
    },
    mainEntityOfPage: `${baseUrl}/rincon-matero`,
  };

  return (
    <>
      {/* Schema.org Structured Data for SEO Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="bg-[#FAF8F5] text-gray-800">
        {/* HERO HEADER */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#254642] via-[#1f4339] to-[#1C3632] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
          <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 bg-[#D4AF37]/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-4 py-1.5 text-xs font-bold tracking-wider text-[#D4AF37] uppercase sm:text-sm">
              <Sparkles className="h-4 w-4" />
              Portal de Conocimiento & Experiencia Matera
            </span>

            <h1 className="mb-6 text-4xl leading-tight font-black tracking-tight text-[#F5F5DC] sm:text-5xl lg:text-6xl">
              El Rincón Matero: Guía, Ritual y Cultura del Mate
            </h1>

            <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-white/85 sm:text-xl">
              Aprendé a curar tu mate paso a paso sin fallar, sacate todas las dudas sobre la yerba,
              repasá las reglas de la ronda y encontrá tu temperatura ideal con nuestros simuladores
              interactivos.
            </p>

            {/* Quick Navigation Anchor Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#curado"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#254642] shadow-lg transition hover:scale-105 hover:bg-[#DAA520] active:scale-95"
              >
                <Wand2 className="h-4 w-4" />
                <span>Guía de Curado</span>
              </a>
              <a
                href="#preguntas"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-[#F5F5DC] backdrop-blur-xs transition hover:bg-white/20 active:scale-95"
              >
                <HelpCircle className="h-4 w-4 text-[#D4AF37]" />
                <span>Preguntas & Mitos</span>
              </a>
              <a
                href="#reglas"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-[#F5F5DC] backdrop-blur-xs transition hover:bg-white/20 active:scale-95"
              >
                <BookOpen className="h-4 w-4 text-[#D4AF37]" />
                <span>10 Reglas de la Ronda</span>
              </a>
              <a
                href="#juegos"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-[#F5F5DC] backdrop-blur-xs transition hover:bg-white/20 active:scale-95"
              >
                <Gamepad2 className="h-4 w-4 text-[#D4AF37]" />
                <span>Desafíos & Simuladores</span>
              </a>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT CONTAINER */}
        <div className="mx-auto max-w-6xl space-y-20 px-4 py-14 sm:px-6 lg:px-8">
          {/* SECTION 1: GUÍA DE CURADO PASO A PASO (SEO PRIORITY) */}
          <section id="curado" className="scroll-mt-24">
            <CuringGuide />
          </section>

          {/* SECTION 2: PREGUNTAS FRECUENTES & MITOS */}
          <section id="preguntas" className="scroll-mt-24">
            <MateroBlogFAQ />
          </section>

          {/* SECTION 3: LAS 10 REGLAS DE LA RONDA DE MATE */}
          <section id="reglas" className="scroll-mt-24">
            <DecalogoRules />
          </section>

          {/* SECTION 4: ZONA INTERACTIVA DE JUEGOS Y DESAFÍOS */}
          <section id="juegos" className="scroll-mt-24 space-y-12">
            <div className="text-center">
              <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
                Zona Interactiva
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#254642] sm:text-4xl">
                Desafíos y Juegos Materos
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
                Poné a prueba tu técnica de cebado, descubrí tu temperatura ideal y evaluá tu perfil
                matero.
              </p>
            </div>

            {/* JUEGO 1: Calculadora de Temperatura y Cebada */}
            <TemperatureCalculator />

            {/* JUEGO 2: Armá el Mate Perfecto */}
            <MateRitualGame />

            {/* JUEGO 3: Adivinanza de Accesorios */}
            <ProductQuizGame />

            {/* JUEGO 4: Test de Personalidad */}
            <MateroPersonalityQuiz />
          </section>
        </div>
      </div>
    </>
  );
}
