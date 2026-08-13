'use client';

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

interface NosotrosFAQProps {
  faqs: FAQ[];
}

export default function NosotrosFAQ({ faqs }: NosotrosFAQProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  return (
    <div className="mb-12">
      <h2 className="mb-8 text-center text-3xl font-bold text-[#254642]">
        Preguntas Frecuentes (FAQ)
      </h2>
      <div className="space-y-4">
        {faqs.slice(0, visibleCount).map((faq, index) => (
          <details key={index} className="group overflow-hidden rounded-lg border border-gray-200">
            <summary className="flex cursor-pointer list-none items-center justify-between bg-white p-4 transition-colors hover:bg-gray-50 focus:outline-none">
              <span className="text-left font-semibold text-[#254642]">{faq.question}</span>
              <span className="ml-4 flex-shrink-0 text-gray-500 transition-transform group-open:rotate-180">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </summary>
            <div className="border-t border-gray-200 bg-gray-50 p-4 text-gray-600">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
      {visibleCount < faqs.length && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="rounded-md bg-[#254642] px-6 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#1a322f]"
          >
            Cargar más
          </button>
        </div>
      )}
    </div>
  );
}
