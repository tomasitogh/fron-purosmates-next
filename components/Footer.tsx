import Link from 'next/link';
import Image from 'next/image';
import { Instagram } from 'lucide-react';

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

export default function Footer() {
  return (
    <footer className="bg-[#E8DCC4] text-[#3D5F54]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Desktop Layout - 3 columns */}
        <div className="hidden items-start gap-12 md:grid md:grid-cols-3">
          {/* Logo Column */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex items-center space-x-3">
              <Link href="/">
                <Image
                  src="/logo-purosmates.png"
                  alt="Puros Mates Logo"
                  width={80}
                  height={80}
                  className="object-contain p-1"
                />
              </Link>
            </div>
            <Link
              href="/"
              className="text-2xl font-bold text-[#3D5F54] transition hover:opacity-80"
            >
              PUROS MATES
            </Link>
          </div>

          {/* Products Column */}
          <div>
            <Link href="/">
              <h3 className="mb-6 text-2xl font-bold text-[#3D5F54] transition hover:opacity-80">
                Productos
              </h3>
            </Link>
            <ul className="space-y-3 text-lg">
              <li>
                <Link href="/shop?category=mate" className="transition hover:opacity-70">
                  Mates
                </Link>
              </li>
              <li>
                <Link href="/shop?category=bombilla" className="transition hover:opacity-70">
                  Bombillas
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accesorio" className="transition hover:opacity-70">
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <Link href="/">
              <h3 className="mb-6 text-2xl font-bold text-[#3D5F54] transition hover:opacity-80">
                Puros Mates
              </h3>
            </Link>
            <div className="mt-6 flex space-x-4">
              <a
                href="https://www.instagram.com/puros.mates/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Síguenos en Instagram"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://wa.me/5491130548207"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contáctanos por WhatsApp"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <WhatsAppIcon size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Centered */}
        <div className="flex flex-col items-center space-y-10 text-center md:hidden">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link href="/" className="mb-4">
              <Image
                src="/logo-purosmates.png"
                alt="Puros Mates Logo"
                width={128}
                height={128}
                className="object-contain p-1"
              />
            </Link>
            <Link
              href="/"
              className="text-3xl font-bold text-[#3D5F54] transition hover:opacity-80"
            >
              PUROS MATES
            </Link>
          </div>

          {/* Products */}
          <div>
            <Link href="/">
              <h3 className="mb-4 text-2xl font-bold text-[#3D5F54] transition hover:opacity-80">
                Productos
              </h3>
            </Link>
            <ul className="space-y-2 text-lg">
              <li>
                <Link href="/shop?category=mate" className="transition hover:opacity-70">
                  Mates
                </Link>
              </li>
              <li>
                <Link href="/shop?category=bombilla" className="transition hover:opacity-70">
                  Bombillas
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accesorio" className="transition hover:opacity-70">
                  Accesorios
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <Link href="/">
              <h3 className="mb-4 text-2xl font-bold text-[#3D5F54] transition hover:opacity-80">
                Puros Mates
              </h3>
            </Link>
            <div className="mt-6 flex justify-center space-x-4">
              <a
                href="https://www.instagram.com/puros.mates/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Síguenos en Instagram"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <Instagram size={28} />
              </a>
              <a
                href="https://wa.me/5491130548207"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contáctanos por WhatsApp"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <WhatsAppIcon size={28} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-[#3D5F54]/20">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-[#3D5F54]">
            Copyright © Puros Mates {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
