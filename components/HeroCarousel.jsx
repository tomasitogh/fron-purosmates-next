'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function HeroCarousel({ images }) {
  const containerRef = useRef(null);
  const [current, setCurrent] = useState(0);

  // Auto scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      const total = images.length;
      const nextIndex = (current + 1) % total;
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: nextIndex * width,
        behavior: 'smooth',
      });
      setCurrent(nextIndex);
    }, 5000);
    return () => clearInterval(interval);
  }, [current, images]);

  const goTo = (index) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    containerRef.current.scrollTo({ left: index * width, behavior: 'smooth' });
    setCurrent(index);
  };

  const prev = () => {
    const prevIndex = (current - 1 + images.length) % images.length;
    goTo(prevIndex);
  };

  const next = () => {
    const nextIndex = (current + 1) % images.length;
    goTo(nextIndex);
  };

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-full snap-center relative h-[250px] sm:h-[400px] md:h-[600px] lg:h-[750px]">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={idx === 0}
              className="object-cover"
              sizes="100vw"
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
        ))}
      </div>
      {/* Navigation arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 md:p-2 hover:bg-white/90 shadow-md z-10"
      >
        <span className="text-xs md:text-base">◀</span>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 rounded-full p-1.5 md:p-2 hover:bg-white/90 shadow-md z-10"
      >
        <span className="text-xs md:text-base">▶</span>
      </button>
      {/* Dots */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              current === idx 
              ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
              : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
