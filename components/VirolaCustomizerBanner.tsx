import Link from 'next/link';
import { Sparkles, ArrowRight, Wand2, ShieldCheck, Zap } from 'lucide-react';

export default function VirolaCustomizerBanner() {
  return (
    <section className="mx-auto my-8 w-full max-w-5xl px-4 md:my-14">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3330] via-[#254642] to-[#122421] p-6 text-white shadow-2xl md:p-10">
        {/* Glow & Decorative accents */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row md:gap-10">
          {/* Text Content */}
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-[#D4AF37] uppercase shadow-inner">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Personalizador de virola</span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              ¿No sabés cómo quedaría tu diseño en la virola?{' '}
              <span className="block text-[#D4AF37] sm:inline">
                Probá nuestro personalizador de virolas 100% gratuito
              </span>
            </h2>

            <p className="mt-3 text-sm text-white/80 sm:text-base md:mt-4">
              No dudes en personalizar ese mate para que sea único.
            </p>

            {/* Badges / Micro-benefits */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-white/90 md:justify-start">
              <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <Wand2 className="h-3.5 w-3.5 text-[#D4AF37]" />
                Grabado láser en tiempo real
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <Zap className="h-3.5 w-3.5 text-[#D4AF37]" />
                Probá tipografías, fotos y símbolos
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
                Sin costo ni registro
              </span>
            </div>
          </div>

          {/* CTA Button & Visual preview badge */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Link
              href="/customize"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#D4AF37] via-[#e5c558] to-[#D4AF37] px-8 py-4 text-base font-bold text-[#1a3330] shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(212,175,55,0.55)] active:scale-95 sm:px-9 sm:py-4.5 sm:text-lg"
            >
              <span>Personalizar mi mate</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <span className="text-xs text-white/60">Abrí el editor interactivo al instante</span>
          </div>
        </div>
      </div>
    </section>
  );
}
