'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { materoFaqs } from './data';

export default function MateroBlogFAQ() {
  const [openId, setOpenId] = useState<number | null>(1);

  const toggleOpen = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-12">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-4 py-1 text-xs font-bold tracking-wide text-[#254642] uppercase sm:text-sm">
          <HelpCircle className="h-3.5 w-3.5 text-[#D4AF37]" />
          Respuestas Frecuentes
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#254642] sm:text-4xl">
          Preguntas Frecuentes y Mitos sobre el Mate
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
          Respuestas a las consultas más habituales sobre digestión, salubridad de los recipientes,
          temperatura de infusión y técnicas de cebado.
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-4">
        {materoFaqs.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? 'border-[#254642] bg-[#FAF8F5] shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleOpen(faq.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition"
                aria-expanded={isOpen}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="w-fit rounded-lg bg-[#254642]/10 px-2.5 py-1 text-xs font-bold text-[#254642]">
                    {faq.category}
                  </span>
                  <h3 className="text-base font-bold text-[#254642] sm:text-lg">{faq.question}</h3>
                </div>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 border-[#254642] bg-[#254642] text-white' : ''
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="animate-fadeIn border-t border-gray-200/60 px-5 pt-3 pb-5 text-sm leading-relaxed text-gray-700 sm:text-base">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
