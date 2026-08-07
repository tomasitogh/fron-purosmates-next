'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalQty } from '@/redux/cartSlice';
import { UserButton, useUser } from '@clerk/nextjs';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import Image from 'next/image';
import { Search, X, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin } = useAuth();
  const totalQty = useSelector(selectCartTotalQty);

  const mounted = typeof window !== 'undefined';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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

  const isAuthenticated = isLoaded && isSignedIn;

  return (
    <header className="sticky top-0 z-50 bg-[#254642] shadow-md">
      <nav className="w-full px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-purosmates.png"
                alt="Puros Mates"
                width={60}
                height={60}
                className="rounded-full object-contain"
                priority
              />
            </Link>
            <Link
              href="/"
              className="text-xl font-semibold tracking-wide !text-[#F5F5DC] transition hover:text-white"
            >
              PUROS MATES
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden flex-row items-center gap-3 min-[856px]:flex">
            {/* Sobre Nosotros - Desktop */}
            <Link
              href="/nosotros"
              className="mr-0 font-medium !text-[#F5F5DC] transition hover:text-white lg:block"
            >
              Sobre Nosotros
            </Link>

            {/* Barra de búsqueda */}
            {/* Barra de búsqueda - Desktop */}
            <form
              onSubmit={onSearchSubmit}
              className="flex w-64 items-center overflow-hidden rounded-xl border border-white/40 bg-white/10 transition-all focus-within:ring-2 focus-within:ring-[#D4AF37]"
            >
              <input
                id="search-desktop"
                ref={searchInputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos..."
                aria-label="Buscar productos"
                className="w-full bg-transparent py-1.5 pl-4 text-white placeholder-white/60 outline-none [&::-webkit-search-cancel-button]:appearance-none"
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

            <button
              type="button"
              onClick={handleCartClick}
              className="relative inline-flex h-10 items-center justify-center rounded-xl border border-[#F5F5DC]/40 bg-transparent px-4 font-medium text-[#F5F5DC] transition hover:bg-white/10 focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:outline-none"
              aria-label="Ir al carrito"
            >
              <ShoppingCart className="h-6 w-6" />
              {mounted && totalQty > 0 && (
                <span className="absolute -top-2 -right-3 grid h-5 w-5 place-items-center rounded-full bg-green-600 text-xs text-white">
                  {totalQty}
                </span>
              )}
            </button>

            {isAuthenticated ? (
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
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex h-10 min-w-[40px] shrink-0 items-center justify-center rounded-full text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none"
                aria-label="Ingresar"
              >
                <User className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="min-[856px]:hidden">
            <button
              onClick={toggleMenu}
              className="flex flex-col space-y-1.5 p-2 focus:outline-none"
              aria-label="Toggle menu"
            >
              <div
                className={`h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
              ></div>
              <div
                className={`h-0.5 w-6 bg-gray-800 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}
              ></div>
              <div
                className={`h-0.5 w-6 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
              ></div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 min-[856px]:hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <ul className="space-y-4 py-4">
            <li>
              <form
                onSubmit={(e) => {
                  onSearchSubmit(e);
                  setIsMenuOpen(false);
                }}
                className="flex w-full items-center overflow-hidden rounded-md border border-gray-300 bg-white transition-colors focus-within:ring-2 focus-within:ring-[#254642]"
              >
                <input
                  id="search-mobile"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-transparent py-2 pl-3 text-gray-900 outline-none [&::-webkit-search-cancel-button]:appearance-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="flex h-full items-center justify-center !border-none !px-0.5 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex h-full items-center justify-center !border-none !px-2 text-gray-500 transition-colors hover:text-[#254642] focus:outline-none"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </li>

            <li>
              <div className="flex w-full flex-col items-center gap-3">
                <div className="flex w-full flex-row flex-wrap items-center gap-3">
                  {/* Sobre Nosotros Button */}
                  <Link
                    href="/nosotros"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-white/60 bg-transparent px-3 whitespace-nowrap text-white transition hover:bg-white/10"
                  >
                    Sobre Nosotros
                  </Link>

                  {/* Cart Button */}
                  <button
                    type="button"
                    onClick={handleCartClick}
                    className="relative inline-flex h-10 items-center justify-center rounded-xl border border-white/60 bg-transparent px-3 text-white transition hover:bg-white/10"
                    aria-label="Ir al carrito"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {mounted && totalQty > 0 && (
                      <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-green-600 text-xs text-white">
                        {totalQty}
                      </span>
                    )}
                  </button>

                  {/* User Button (Login/Logout) */}
                  {isAuthenticated ? (
                    <div className="inline-flex h-10 items-center justify-center rounded-xl px-3">
                      <UserButton>
                        {isAdmin() && (
                          <UserButton.MenuItems>
                            <UserButton.Action
                              label="Administrador"
                              labelIcon={<span>🔧</span>}
                              onClick={() => {
                                router.push('/admin');
                                setIsMenuOpen(false);
                              }}
                            />
                          </UserButton.MenuItems>
                        )}
                      </UserButton>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/60 bg-transparent px-3 text-white transition hover:bg-white/10"
                      aria-label="Ingresar"
                    >
                      <User className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Buy Now Button */}
                <button
                  onClick={() => {
                    router.push('/shop');
                    setIsMenuOpen(false);
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-[#D4AF37] px-6 font-semibold whitespace-nowrap text-[#254642] transition hover:bg-[#DAA520] focus:outline-none"
                >
                  Comprar Ahora
                </button>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
