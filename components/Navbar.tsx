'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalQty } from '@/redux/cartSlice';
import { UserButton, useUser } from '@clerk/nextjs';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronRight,
  Gift,
  Heart,
  Home,
  Info,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsExpanded, setIsProductsExpanded] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin } = useAuth();
  const totalQty = useSelector(selectCartTotalQty);

  const [mounted, setMounted] = useState(false);
  const isAuthenticated = isLoaded && isSignedIn;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar el valor de búsqueda si cambia la URL y asegurar cierre de menús
  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setIsMenuOpen(false);
    setIsSearchOpenMobile(false);
  }, [pathname, searchParams]);

  // Cerrar menú con la tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsSearchOpenMobile(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = () => setIsMenuOpen((open) => !open);
  const closeMenu = () => setIsMenuOpen(false);

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
    setIsSearchOpenMobile(false);
  };

  const openAuthModal = () => {
    setIsMenuOpen(false);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#254642] shadow-md">
        <nav className="w-full" aria-label="Navegación principal">
          {/* Barra principal superior */}
          <div className="flex h-16 w-full items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8">
            {/* 1. IZQUIERDA: Botón hamburguesa (SOLO MOBILE lg:hidden) + LOGO */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={toggleMenu}
                className="flex shrink-0 items-center justify-center rounded-xl p-1.5 text-[#F5F5DC] transition hover:bg-white/10 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none sm:p-2 lg:hidden"
                aria-label="Abrir menú de navegación"
                aria-expanded={isMenuOpen}
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <Link
                href="/"
                onClick={closeMenu}
                className="flex shrink-0 items-center gap-1.5 transition hover:opacity-90 sm:gap-2"
              >
                <Image
                  src="/logo-purosmates.png"
                  alt="Logo Puros Mates"
                  width={34}
                  height={34}
                  className="shrink-0 rounded-full object-contain sm:h-[38px] sm:w-[38px]"
                  priority
                />
                <span className="text-sm font-bold tracking-wider whitespace-nowrap text-[#F5F5DC] sm:text-base lg:text-lg xl:text-xl">
                  PUROS MATES
                </span>
              </Link>
            </div>

            {/* 2. CENTRO: Enlaces principales en Desktop */}
            <div className="hidden items-center gap-1 lg:flex xl:gap-3">
              <Link
                href="/shop"
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide uppercase transition xl:px-4 xl:text-sm ${
                  pathname === '/shop'
                    ? 'bg-white/15 text-[#D4AF37]'
                    : 'text-[#F5F5DC] hover:bg-white/10 hover:text-white'
                }`}
              >
                Tienda
              </Link>
              <Link
                href="/regalos-empresariales"
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide uppercase transition xl:px-4 xl:text-sm ${
                  pathname === '/regalos-empresariales'
                    ? 'bg-white/15 text-[#D4AF37]'
                    : 'text-[#F5F5DC] hover:bg-white/10 hover:text-white'
                }`}
              >
                Regalos Empresariales
              </Link>
              <Link
                href="/rincon-matero"
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide uppercase transition xl:px-4 xl:text-sm ${
                  pathname === '/rincon-matero'
                    ? 'bg-white/15 text-[#D4AF37]'
                    : 'text-[#F5F5DC] hover:bg-white/10 hover:text-white'
                }`}
              >
                Rincón Matero
              </Link>
              <Link
                href="/nosotros"
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold tracking-wide uppercase transition xl:px-4 xl:text-sm ${
                  pathname === '/nosotros'
                    ? 'bg-white/15 text-[#D4AF37]'
                    : 'text-[#F5F5DC] hover:bg-white/10 hover:text-white'
                }`}
              >
                About Us
              </Link>
            </div>

            {/* 3. DERECHA: Buscador, Cuenta y Carrito */}
            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              {/* Buscador para pantallas medianas/grandes */}
              <form
                onSubmit={onSearchSubmit}
                className="hidden items-center overflow-hidden rounded-xl border border-white/30 bg-white/10 transition-all focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/30 md:flex md:w-32 lg:w-36 xl:w-52"
              >
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs text-white placeholder-white/60 outline-none md:text-xs xl:text-sm [&::-webkit-search-cancel-button]:appearance-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="p-1 text-white/50 hover:text-white"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-xl border-none p-1.5 text-white/70 transition-colors hover:text-white sm:p-2"
                  aria-label="Buscar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Botón lupa para abrir buscador en móviles */}
              <button
                type="button"
                onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
                className="flex items-center justify-center rounded-xl p-2 text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none md:hidden"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Botón de cuenta/perfil en Desktop */}
              <div className="hidden lg:flex lg:items-center">
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
                    onClick={openAuthModal}
                    className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-[#F5F5DC] transition hover:border-[#D4AF37] hover:bg-white/20 focus:outline-none"
                    aria-label="Ingresar"
                    title="Ingresar a tu cuenta"
                  >
                    <User className="h-4 w-4 text-[#D4AF37]" />
                    <span className="hidden xl:inline">Ingresar</span>
                  </button>
                )}
              </div>

              {/* Carrito de compras (Arriba a la derecha - ícono nítido y circular) */}
              <button
                type="button"
                onClick={handleCartClick}
                className="group relative flex items-center justify-center rounded-full border border-[#D4AF37]/50 bg-white/10 text-[#D4AF37] shadow-sm transition-all duration-200 hover:scale-105 hover:border-[#D4AF37] hover:bg-[#D4AF37]/20 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none active:scale-95"
                aria-label="Ir al carrito de compras"
                title="Ver carrito de compras"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:scale-110"
                >
                  <circle cx="8" cy="21" r="1.5" />
                  <circle cx="19" cy="21" r="1.5" />
                  <path d="M2 2h3l2.6 12.2a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.2H6" />
                </svg>
                {mounted && totalQty > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[11px] font-extrabold text-[#254642] shadow-md ring-2 ring-[#254642]">
                    {totalQty > 99 ? '99+' : totalQty}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Barra de búsqueda desplegable en móviles */}
          {isSearchOpenMobile && (
            <div className="border-t border-white/10 bg-[#1f3b38] px-4 py-2.5 md:hidden">
              <form
                onSubmit={onSearchSubmit}
                className="flex items-center overflow-hidden rounded-xl border border-white/40 bg-white/10"
              >
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar mates, bombillas..."
                  autoFocus
                  className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-white/60 outline-none [&::-webkit-search-cancel-button]:appearance-none"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="p-1.5 text-white/50 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="p-2 text-[#D4AF37] transition-colors hover:text-white"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}
        </nav>
      </header>

      {/* MENÚ LATERAL DESPLEGABLE (Drawer) - Solo para Mobile / Tablet */}
      {/* Fondo oscurecido al abrir menú */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Panel lateral que se desliza desde la izquierda */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-white/10 bg-[#254642] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del menú */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-purosmates.png"
              alt="Puros Mates"
              width={34}
              height={34}
              className="rounded-full object-contain"
            />
            <span className="font-bold tracking-wide text-[#F5F5DC]">PUROS MATES</span>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="rounded-lg p-1.5 text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Opciones del menú */}
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {/* Opción 1: Home / Inicio */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
          >
            <Home className="h-5 w-5 text-[#D4AF37]" />
            <span>Inicio</span>
          </Link>

          {/* Opción 2: Productos con Submenú Desplegable */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <button
              type="button"
              onClick={() => setIsProductsExpanded(!isProductsExpanded)}
              className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-[#F5F5DC] transition hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-[#D4AF37]" />
                <span>Productos</span>
              </div>
              {isProductsExpanded ? (
                <ChevronDown className="h-4 w-4 text-[#D4AF37] transition-transform" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#F5F5DC]/60 transition-transform" />
              )}
            </button>

            {/* Subcategorías de productos */}
            {isProductsExpanded && (
              <div className="space-y-1 border-t border-white/10 bg-black/10 py-1.5 pr-3 pl-6">
                <Link
                  href="/shop"
                  onClick={closeMenu}
                  className="flex items-center rounded-lg px-3 py-2 text-sm text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
                >
                  <span>Ver todos los productos</span>
                </Link>
                <Link
                  href="/shop?category=mate"
                  onClick={closeMenu}
                  className="flex items-center rounded-lg px-3 py-2 text-sm text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
                >
                  <span>Mates</span>
                </Link>
                <Link
                  href="/shop?category=bombilla"
                  onClick={closeMenu}
                  className="flex items-center rounded-lg px-3 py-2 text-sm text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
                >
                  <span>Bombillas</span>
                </Link>
                <Link
                  href="/shop?category=accesorios"
                  onClick={closeMenu}
                  className="flex items-center rounded-lg px-3 py-2 text-sm text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
                >
                  <span>Accesorios</span>
                </Link>
              </div>
            )}
          </div>

          {/* Opción 3: Mi Carrito */}
          <Link
            href="/carrito"
            onClick={closeMenu}
            className="flex items-center justify-between rounded-xl px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
              <span>Mi Carrito</span>
            </div>
            {mounted && totalQty > 0 && (
              <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-xs font-bold text-[#254642]">
                {totalQty} {totalQty === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </Link>

          {/* Opción 4: About Us */}
          <Link
            href="/nosotros"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
          >
            <Info className="h-5 w-5 text-[#D4AF37]" />
            <span>About Us</span>
          </Link>

          {/* Opción 5: Regalos Empresariales */}
          <Link
            href="/regalos-empresariales"
            onClick={closeMenu}
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-white/10 hover:text-white"
          >
            <Gift className="h-5 w-5 text-[#D4AF37]" />
            <span>Regalos Empresariales</span>
          </Link>

          {/* Opción 6: Rincón Matero */}
          <Link
            href="/rincon-matero"
            onClick={closeMenu}
            className="flex items-center justify-between rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 font-medium text-[#F5F5DC] transition hover:bg-[#D4AF37]/20 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              <span>Rincón Matero</span>
            </div>
            <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-bold text-[#254642] uppercase">
              Juegos
            </span>
          </Link>
        </div>

        {/* Pie del menú con botón de compra rápida */}
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={() => {
              router.push('/shop');
              closeMenu();
            }}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#D4AF37] font-semibold text-[#254642] shadow transition hover:bg-[#DAA520] active:scale-[0.98]"
          >
            Ver Tienda Completa
          </button>
        </div>
      </aside>

      {/* Barra inferior rápida - EXCLUSIVA PARA MÓVILES (Oculta en Desktop con lg:hidden) */}
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-[#254642] shadow-lg lg:hidden"
      >
        <div className="mx-auto flex h-14 max-w-xl items-center justify-around px-1">
          <BottomNavItem
            href="/"
            label="Inicio"
            icon={<Home className="h-5 w-5" />}
            active={pathname === '/'}
          />
          <BottomNavItem
            href="/shop"
            label="Tienda"
            icon={<ShoppingBag className="h-5 w-5" />}
            active={pathname.startsWith('/shop')}
          />
          <BottomNavItem
            href="/carrito"
            label="Carrito"
            icon={<ShoppingCart className="h-5 w-5" />}
            active={pathname.startsWith('/carrito')}
            badge={mounted ? totalQty : 0}
          />
          <BottomNavItem
            href="/favoritos"
            label="Favoritos"
            icon={<Heart className="h-5 w-5" />}
            active={pathname.startsWith('/favoritos')}
          />
          {isAuthenticated ? (
            <div className="flex h-14 min-w-[50px] flex-1 flex-col items-center justify-center sm:w-14 sm:flex-initial">
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
              className="flex h-14 min-w-[50px] flex-1 flex-col items-center justify-center rounded-lg text-[#F5F5DC] transition hover:bg-white/10 focus:outline-none sm:w-14 sm:flex-initial"
              aria-label="Ingresar"
            >
              <User className="h-5 w-5" />
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
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-14 min-w-[50px] flex-1 flex-col items-center justify-center rounded-lg transition hover:bg-white/10 sm:w-14 sm:flex-initial ${
        active ? 'text-[#D4AF37]' : 'text-[#F5F5DC]'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-bold text-[#254642] shadow">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="mt-0.5 text-[10px] font-medium">{label}</span>
    </Link>
  );
}
