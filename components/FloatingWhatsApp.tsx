import React from 'react';

const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
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
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center bg-[#25D366] text-white"
        >
            <WhatsAppIcon size={32} />
        </a>
    );
}
