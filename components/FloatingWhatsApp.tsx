import React from 'react';

const WhatsAppIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a0.5 .5 0 0 0 1 0v-1a0.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a0.5 .5 0 0 0 0 -1h-1a0.5 .5 0 0 0 0 1" />
  </svg>
);

export default function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/5491130548207"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos por WhatsApp"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-40 flex [transform:translateZ(0)] items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl active:scale-95 sm:right-6 lg:right-8 lg:bottom-6 lg:p-4"
    >
      <WhatsAppIcon size={28} className="lg:hidden" />
      <WhatsAppIcon size={32} className="hidden lg:block" />
    </a>
  );
}
