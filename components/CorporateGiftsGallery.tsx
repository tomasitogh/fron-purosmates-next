'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface GalleryItem {
  image: string;
  alt: string;
  client: string;
  description: string;
}

export default function CorporateGiftsGallery({ items }: { items: GalleryItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex((index + items.length) % items.length);
    },
    [items.length]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying, next]);

  const handleManualNav = (fn: () => void) => {
    setIsAutoPlaying(false);
    fn();
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative">
      {items.length === 0 && (
        <p className="py-8 text-center text-gray-500">
          Próximamente estrenamos nuestros proyectos.
        </p>
      )}

      {/* Desktop: 3-card grid */}
      <div className="hidden gap-6 md:grid md:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={`${item.client}-${index}`}
            className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="p-5">
              <h4 className="mb-1 font-bold text-[#254642]">{item.client}</h4>
              <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                <Quote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" />
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="md:hidden">
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item, index) => (
              <div key={`${item.client}-${index}`} className="w-full flex-shrink-0">
                <div className="bg-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                  <div className="p-5">
                    <h4 className="mb-1 font-bold text-[#254642]">{item.client}</h4>
                    <p className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                      <Quote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" />
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav arrows */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => handleManualNav(prev)}
            className="flex items-center justify-center rounded-full border border-[#254642]/20 bg-white text-[#254642] transition-colors hover:bg-[#254642] hover:text-white"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleManualNav(() => goTo(i))}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-8 bg-[#D4AF37]'
                    : 'w-2.5 bg-[#254642]/20 hover:bg-[#254642]/40'
                }`}
                aria-label={`Ir al slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleManualNav(next)}
            className="flex items-center justify-center rounded-full border border-[#254642]/20 bg-white text-[#254642] transition-colors hover:bg-[#254642] hover:text-white"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
