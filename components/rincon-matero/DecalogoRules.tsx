'use client';

import { BookOpen } from 'lucide-react';
import { unwrittenRulesData } from './data';

export default function DecalogoRules() {
  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-[#FAF8F5] p-6 shadow-lg sm:p-8 md:p-12">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-4 py-1 text-xs font-bold tracking-wide text-[#254642] uppercase sm:text-sm">
          <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
          Código Cultural
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#254642] sm:text-4xl">
          Las 10 Reglas de la Ronda de Mate
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
          Normas de cortesía y técnica que rigen la tradición del mate compartido.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {unwrittenRulesData.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-[#254642]/10 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#254642]/30 hover:shadow-md"
          >
            <div className="flex items-start gap-3.5">
              <span className="shrink-0 rounded-lg bg-[#254642] px-2.5 py-1 text-xs font-bold text-[#F5F5DC] shadow-2xs">
                Regla {item.ruleNumber}
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#254642] sm:text-lg">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 sm:text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
