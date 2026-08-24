import type { Metadata } from 'next';
import CustomizerLoader from '@/components/customize/CustomizerLoader';
import { GOOGLE_FONTS_HREF } from '@/components/customize/constants';

export const metadata: Metadata = {
  title: 'Personalizador de Virolas 100% Gratuito | Puros Mates',
  description:
    'Diseñá tu mate ideal en tiempo real: grabá tu frase, escudo, iniciales o dibujo en la virola de alpaca o acero con precisión láser.',
  openGraph: {
    title: 'Personalizador de Virolas Online - Puros Mates',
    description: 'Creá tu diseño único de grabado láser en virola antes de comprar.',
  },
};

export default function CustomizePage() {
  return (
    <div className="min-h-screen bg-stone-50/60 pb-20 sm:pb-16">
      {/* React 19 eleva estos <link> al <head>: cargan las 10 tipografías del editor */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" precedence="default" href={GOOGLE_FONTS_HREF} />

      {/* Hero / Marketing Header */}
      <section className="border-b border-stone-200/80 bg-gradient-to-b from-[#254642] to-[#1a3330] px-4 py-8 text-white md:py-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
            <span>Herramienta Interactiva 100% Gratuita</span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Diseñá el Grabado de tu Virola
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-stone-200 sm:text-base md:text-lg">
            Personalizá tu mate en vivo. Escribí tus nombres, fechas o frases especiales, sumá
            símbolos o subí tu propio logo para ver cómo quedará grabado con láser en el metal.
          </p>

          {/* Marketing Steps */}
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 md:mt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#1a3330]">
                1
              </span>
              <p className="text-xs text-white/90">Elegí texto, tipografía o subí tu imagen/logo</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#1a3330]">
                2
              </span>
              <p className="text-xs text-white/90">
                Ajustá la curvatura, ángulo y tamaño sobre la virola
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xs">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-xs font-bold text-[#1a3330]">
                3
              </span>
              <p className="text-xs text-white/90">
                Descargá tu matriz SVG lista para el grabado láser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editor Main Content */}
      <main className="mx-auto w-full max-w-5xl px-3 pt-6 sm:px-4 md:pt-10">
        <div className="mb-6 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 sm:text-sm">
          <span className="font-bold text-amber-950">💡 Consejo de diseño: </span>
          Todo elemento ubicado sobre el anillo plateado se graba con láser de alta precisión. Podés
          arrastrar los textos y figuras alrededor del aro para encontrar la posición perfecta.
        </div>

        <CustomizerLoader />
      </main>
    </div>
  );
}
