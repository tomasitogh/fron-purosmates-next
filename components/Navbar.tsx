'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalQty } from '@/redux/cartSlice';
import { UserButton, useUser } from '@clerk/nextjs';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import Image from 'next/image';
import { Heart, Home, Menu, Search, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin } = useAuth();
  const totalQty = useSelector(selectCartTotalQty);

  const mounted = typeof window !== 'undefined';

  const isAuthenticated = isLoaded && isSignedIn;

  const toggleMenu = () => setIsMenuOpen((open) => !open);

  const handleCartClick = () => {
    router.push('/carrito');
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }

    router.push(`/shop?${params.toString()}`);
  };

  const openAuthModal = () => {
    setIsMenuOpen(false);
    setIsAuthModalOpen(true);
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#254642] shadow-md">
        <nav className="w-full">
          {/* Barra superior */}
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            {/* Menú hamburguesa */}
            <div className="flex w-12 items-center">
              <button
                onClick={toggleMenu}
                className="flex flex-col items-center justify-center rounded-lg p-2 text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none"
                aria-label="Abrir menú"
                aria-expanded={isMenuOpen}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Logo centrado */}
            <Link
              href="/"
              onClick={closeMenu}
              className="flex flex-1 items-center justify-center gap-2"
            >
              <Image
                src="/logo-purosmates.png"
                alt="Puros Mates"
                width={44}
                height={44}
                className="rounded-full object-contain"
                priority
              />
              <span className="text-xl font-semibold tracking-wide !text-[#F5F5DC] transition hover:text-white">
                PUROS MATES
              </span>
            </Link>

            {/* Carrito */}
            <div className="flex w-12 items-center justify-end">
              <button
                type="button"
                onClick={handleCartClick}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none"
                aria-label="Ir al carrito"
              >
                <ShoppingCart className="h-6 w-6" />
                {mounted && totalQty > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-green-600 text-xs text-white">
                    {totalQty}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Menú desplegable */}
          <div
            className={`overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 border-t border-white/10' : 'max-h-0'}`}
          >
            <div className="space-y-4 px-4 py-4 lg:px-6">
              <form
                onSubmit={(e) => {
                  onSearchSubmit(e);
                  closeMenu();
                }}
                className="flex w-full items-center overflow-hidden rounded-xl border border-white/40 bg-white/10 transition-colors focus-within:ring-2 focus-within:ring-[#D4AF37]"
              >
                <input
                  id="search-menu"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-transparent py-2 pl-4 text-white placeholder-white/60 outline-none [&::-webkit-search-cancel-button]:appearance-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ('');
                      searchInputRef.current?.focus();
                    }}
                    className="flex h-full items-center justify-center !border-none !px-0.5 text-white/50 transition-colors hover:text-white focus:outline-none"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex h-full items-center justify-center !border-none !px-2 text-white/70 transition-colors hover:text-white focus:outline-none"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>

              <div className="flex flex-col gap-2">
                <Link
                  href="/nosotros"
                  onClick={closeMenu}
                  className="flex h-10 items-center rounded-xl border border-white/60 px-4 text-[#F5F5DC] transition hover:bg-white/10"
                >
                  Sobre Nosotros
                </Link>
                <Link
                  href="/regalos-empresariales"
                  onClick={closeMenu}
                  className="flex h-10 items-center rounded-xl border border-white/60 px-4 text-[#F5F5DC] transition hover:bg-white/10"
                >
                  Regalos Empresariales
                </Link>
              </div>

              <button
                onClick={() => {
                  router.push('/shop');
                  closeMenu();
                }}
                className="flex h-10 w-full items-center justify-center rounded-xl bg-[#D4AF37] px-6 font-semibold text-[#254642] transition hover:bg-[#DAA520] focus:outline-none"
              >
                Comprar Ahora
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-[#254642]">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-around px-2">
          <BottomNavItem
            href="/"
            label="Inicio"
            icon={<Home className="h-6 w-6" />}
            active={pathname === '/'}
          />
          <BottomNavItem
            href="/shop"
            label="Tienda"
            icon={<ShoppingBag className="h-6 w-6" />}
            active={pathname.startsWith('/shop')}
          />
          <BottomNavItem
            href="/favoritos"
            label="Favoritos"
            icon={<Heart className="h-6 w-6" />}
            active={pathname.startsWith('/favoritos')}
          />
          {isAuthenticated ? (
            <div className="flex h-14 flex-col items-center justify-center">
              <UserButton>
                {isAdmin() && (
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Administrador"
                      labelIcon={<span>🔧</span>}
                      onClick={() => router.push('/admin')}
                    />
                  </UserButton.MenuItems>
                )}
              </UserButton>
              <span className="mt-0.5 text-[10px] font-medium text-[#F5F5DC]">Perfil</span>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex h-14 w-16 flex-col items-center justify-center rounded-lg text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none"
              aria-label="Ingresar"
            >
              <User className="h-6 w-6" />
              <span className="mt-0.5 text-[10px] font-medium">Perfil</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

function BottomNavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 w-16 flex-col items-center justify-center rounded-lg transition hover:bg-white/10 ${
        active ? 'text-[#D4AF37]' : 'text-[#F5F5DC]'
      }`}
    >
      {icon}
      <span className="mt-0.5 text-[10px] font-medium">{label}</span>
    </Link>
  );
}
