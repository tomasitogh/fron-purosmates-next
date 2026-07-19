'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cloudinaryLoader } from '@/lib/cloudinary';

const loaderFor = (src: string) =>
  src.includes('res.cloudinary.com') ? cloudinaryLoader : undefined;

interface HeroImage {
  src: string;
  alt: string;
  link?: string;
  caption?: string;
}

interface HeroCarouselProps {
  images: HeroImage[];
}

export default function HeroCarousel({ images }: HeroCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  // Inicializamos con el primer slide (y el siguiente) visibles para que
  // la imagen LCP se pinte en el SSR sin esperar hidratación.
  const [visibleImages, setVisibleImages] = useState<number[]>([0, 1]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const centerIndex = Math.round(scrollLeft / width);
    setCurrent(centerIndex);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!containerRef.current || images.length <= 1) return;
    const interval = setInterval(() => {
      if (!containerRef.current || document.hidden) return;
      const total = images.length;
      const nextIndex = (current + 1) % total;
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollLeft = nextIndex * width;
      setCurrent(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [current, images.length]);

  useEffect(() => {
    const indices: number[] = [];
    indices.push(current);
    if (current > 0) indices.push(current - 1);
    if (current < images.length - 1) indices.push(current + 1);
    setVisibleImages(indices);
  }, [current, images.length]);

  const goTo = useCallback((index: number) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollLeft = index * width;
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    const prevIndex = (current - 1 + images.length) % images.length;
    goTo(prevIndex);
  }, [current, images.length, goTo]);

  const next = useCallback(() => {
    const nextIndex = (current + 1) % images.length;
    goTo(nextIndex);
  }, [current, images.length, goTo]);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'auto' }}
      >
        {images.map((img, idx) => {
          const linkUrl = img.link;
          const isVisible = visibleImages.includes(idx);
          const slideContent = (
            <div key={idx} className="flex-shrink-0 w-full snap-center relative aspect-[16/9]">
              <Image
                src={img.src}
                alt={img.alt}
                loader={loaderFor(img.src)}
                fill
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
                className="object-cover"
                sizes="100vw"
                hidden={!isVisible && images.length > 1}
              />
              {img.caption && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                  <div className="bg-black/40 backdrop-blur-md text-white px-4 md:px-8 py-2 md:py-4 rounded-lg md:rounded-xl border border-white/20 shadow-2xl transform transition-all">
                    <span className="text-sm md:text-3xl font-bold tracking-wide uppercase text-center block">
                      {img.caption}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );

          if (linkUrl) {
            return (
              <Link key={idx} href={linkUrl} className="flex-shrink-0 w-full snap-center">
                {slideContent}
              </Link>
            );
          }

          return <div key={idx} className="flex-shrink-0 w-full snap-center">{slideContent}</div>;
        })}
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute border-transparent left-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 md:p-3 hover:bg-white/80 transition-all duration-200 z-10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 text-gray-700 group-hover:text-gray-900 transition-colors">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute border-transparent right-2 top-1/2 -translate-y-1/2 bg-white/50 rounded-full p-2 md:p-3 hover:bg-white/90 transition-all duration-200 z-10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 text-gray-700 group-hover:text-gray-900 transition-colors">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="absolute bottom-4 md:bottom-6 left-4 right-4 z-10 flex gap-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`flex-1 py-0.5 md:h-1 md:py-1 rounded-lg transition-all border border-transparent duration-300 ${current === idx
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.1)] scale-y-125'
                  : 'bg-white/30 hover:bg-white/50'
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}