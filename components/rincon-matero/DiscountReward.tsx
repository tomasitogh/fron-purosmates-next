'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Gift } from 'lucide-react';

export default function DiscountReward() {
  const [copied, setCopied] = useState(false);
  const couponCode = 'RITUALMATERO';

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#D4AF37]/40 bg-gradient-to-br from-[#254642] via-[#1f4339] to-[#1C3632] p-8 text-center text-white shadow-2xl sm:p-12 md:p-16">
      {/* Background glowing circles */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37] shadow-lg">
          <Gift className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1 text-xs font-bold tracking-widest text-[#D4AF37] uppercase sm:text-sm">
          Beneficio Exclusivo
        </span>

        <h2 className="mt-3 text-3xl font-black text-[#F5F5DC] sm:text-4xl lg:text-5xl">
          Recompensa para tu Próximo Mate
        </h2>

        <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
          Por haber recorrido nuestra guía y completado los desafíos interactivos, te otorgamos un{' '}
          <strong className="text-[#D4AF37]">10% de Descuento</strong> en tu compra de mates,
          bombillas y accesorios en nuestra tienda oficial.
        </p>

        {/* Coupon Box */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#D4AF37] bg-white/10 px-6 py-3.5 backdrop-blur-xs">
            <span className="text-xs font-medium text-white/70 uppercase">CUPÓN:</span>
            <span className="font-mono text-xl font-black tracking-wider text-[#D4AF37]">
              {couponCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3.5 text-sm font-bold text-[#254642] shadow-lg transition hover:bg-[#DAA520] hover:shadow-xl active:scale-95 sm:text-base"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5" />
                <span>Cupón Copiado al Portapapeles</span>
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                <span>Copiar Cupón</span>
              </>
            )}
          </button>
        </div>

        {/* Shop CTA */}
        <div className="mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#F5F5DC] underline decoration-[#D4AF37] decoration-2 underline-offset-4 transition hover:text-[#D4AF37] sm:text-base"
          >
            <span>Explorar la tienda y aplicar beneficio</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
