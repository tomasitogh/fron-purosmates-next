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
        {/* Desktop Layout - 4 columns */}
        <div className="hidden items-start gap-8 md:grid md:grid-cols-4">
          {/* Logo Column */}
          <div className="flex flex-col items-start">
            <div className="mb-4 flex items-center space-x-3">
              <Link href="/">
                <Image
                  src="/logo-purosmates.png"
                  alt="Puros Mates Logo - Mates artesanales argentinos"
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
            <p className="mt-2 text-sm text-[#3D5F54]/80">Mates artesanales argentinos</p>
            <div className="mt-4 flex space-x-3">
              <a
                href="https://www.instagram.com/puros.mates/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Síguenos en Instagram"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://wa.me/5491130548207"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contáctanos por WhatsApp"
                className="rounded-full border border-[#3D5F54] p-2 text-[#3D5F54] transition hover:bg-[#3D5F54] hover:text-[#E8DCC4] hover:opacity-80"
              >
                <WhatsAppIcon size={20} />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#3D5F54]">Productos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop?category=mates" className="transition hover:opacity-70">
                  Mates Artesanales
                </Link>
              </li>
              <li>
                <Link href="/shop?category=bombillas" className="transition hover:opacity-70">
                  Bombillas
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accesorios" className="transition hover:opacity-70">
                  Accesorios para Mate
                </Link>
              </li>
              <li>
                <Link href="/shop" className="transition hover:opacity-70">
                  Todos los Productos
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#3D5F54]">Información</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/nosotros" className="transition hover:opacity-70">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/rincon-matero"
                  className="font-semibold text-[#D4AF37] transition hover:opacity-70"
                >
                  El Rincón Matero (Juegos & Tips) 🧉
                </Link>
              </li>
              <li>
                <Link href="/nosotros#faq" className="transition hover:opacity-70">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <span className="text-[#3D5F54]/70">WhatsApp: 11 3054 8207</span>
              </li>
            </ul>
          </div>

          {/* SEO Content Column */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#3D5F54]">Envíos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-[#3D5F54]/80">Envíos a todo el país</span>
              </li>
              <li>
                <span className="text-[#3D5F54]/80">Envío gratis en Canning</span>
              </li>
              <li>
                <span className="text-[#3D5F54]/80">Correo Argentino Paq.ar</span>
              </li>
              <li>
                <span className="text-[#3D5F54]/80">2 a 5 días hábiles</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile Layout - Centered */}
        <div className="flex flex-col items-center space-y-10 text-center md:hidden">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link href="/" className="mb-4">
              <Image
                src="/logo-purosmates.png"
                alt="Puros Mates Logo - Mates artesanales argentinos"
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
            <p className="mt-2 text-sm text-[#3D5F54]/80">Mates artesanales argentinos</p>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-[#3D5F54]">Productos</h3>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/shop?category=mate" className="transition hover:opacity-70">
                  Mates Artesanales
                </Link>
              </li>
              <li>
                <Link href="/shop?category=bombilla" className="transition hover:opacity-70">
                  Bombillas
                </Link>
              </li>
              <li>
                <Link href="/shop?category=accesorio" className="transition hover:opacity-70">
                  Accesorios para Mate
                </Link>
              </li>
              <li>
                <Link href="/shop" className="transition hover:opacity-70">
                  Todos los Productos
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-[#3D5F54]">Información</h3>
            <ul className="space-y-2 text-base">
              <li>
                <Link href="/nosotros" className="transition hover:opacity-70">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/rincon-matero"
                  className="font-semibold text-[#D4AF37] transition hover:opacity-70"
                >
                  El Rincón Matero (Juegos & Tips) 🧉
                </Link>
              </li>
              <li>
                <Link href="/nosotros#faq" className="transition hover:opacity-70">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="flex justify-center space-x-4">
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

      {/* Footer Bottom */}
      <div className="border-t border-[#3D5F54]/20">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <p className="text-center text-sm text-[#3D5F54]">
            &copy; {new Date().getFullYear()} Puros Mates - Mates Artesanales Argentinos. Todos los
            derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
