'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalQty } from '@/redux/cartSlice';
import { useSession, signOut } from 'next-auth/react';
import AuthModal from './AuthModal';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { Search, X, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [q, setQ] = useState("");
    const [mounted, setMounted] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: session, status } = useSession();
    const totalQty = useSelector(selectCartTotalQty);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();

    useEffect(() => {
        setMounted(true);
        setQ(searchParams.get("q") || "");
    }, [searchParams]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        signOut({ callbackUrl: '/' });
    };

    const handleCartClick = () => {
        router.push('/carrito');
    };

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());

        if (q.trim()) {
            params.set("q", q.trim());
        } else {
            params.delete("q");
        }

        router.push(`/?${params.toString()}`);
    };

    const isAdmin = session?.user?.role === 'ADMIN';
    const isAuthenticated = status === 'authenticated';

    return (
        <header className="bg-[#254642] shadow-md sticky top-0 z-50">
            <nav className="w-full px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo-purosmates.png?v=2"
                                alt="Puros Mates"
                                width={60}
                                height={60}
                                className="object-contain rounded-full"
                                priority
                                unoptimized={true} // Add unoptimized to skip potential next/image cache issues for this specific asset if needed
                            />
                        </Link>
                        <Link
                            href="/"
                            className="text-xl font-semibold tracking-wide !text-[#F5F5DC] hover:text-white transition"
                        >
                            PUROS MATES
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden min-[856px]:flex flex-row items-center gap-3">


                        {/* Sobre Nosotros - Desktop */}
                        <Link
                            href="/nosotros"
                            className=" lg:block !text-[#F5F5DC] hover:text-white transition font-medium mr-0"
                        >
                            Sobre Nosotros
                        </Link>

                        {/* Barra de búsqueda */}
                        {/* Barra de búsqueda - Desktop */}
                        <form onSubmit={onSearchSubmit} className="flex items-center w-64 rounded-xl border border-white/40 bg-white/10 overflow-hidden focus-within:ring-2 focus-within:ring-[#D4AF37] transition-all">
                            <input
                                id="search-desktop"
                                ref={searchInputRef}
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar productos..."
                                aria-label="Buscar productos"
                                className="w-full bg-transparent pl-4 py-1.5 text-white placeholder-white/60 outline-none [&::-webkit-search-cancel-button]:appearance-none"
                            />
                            {q && (
                                <button
                                    type="button"
                                    onClick={() => { setQ(""); searchInputRef.current?.focus(); }}
                                    className="!px-0.5 text-white/50 hover:text-white transition-colors !border-none focus:outline-none h-full flex items-center justify-center"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="!px-2 text-white/70 hover:text-white transition-colors !border-none focus:outline-none h-full flex items-center justify-center"
                                aria-label="Buscar"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={handleCartClick}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-[#F5F5DC] border border-[#F5F5DC]/40 bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 transition relative"
                            aria-label="Ir al carrito"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {mounted && totalQty > 0 && (
                                <span className="absolute -top-2 -right-3 text-xs bg-green-600 text-white rounded-full w-5 h-5 grid place-items-center">
                                    {totalQty}
                                </span>
                            )}
                        </button>

                        {isAuthenticated && isAdmin && (
                            <Link
                                href="/admin"
                                className="text-[#F5F5DC] hover:text-white transition font-medium"
                            >
                                🔧 Panel Admin
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <div className="flex flex-row items-center gap-4 flex-wrap">

                                <button
                                    onClick={handleLogout}
                                    className="bg-white/10 text-[#F5F5DC] px-4 py-2 rounded-lg hover:bg-white/20 transition shadow-sm"
                                >
                                    Cerrar sesión
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="flex min-w-[40px] h-10 shrink-0 items-center justify-center rounded-full text-[#F5F5DC] hover:bg-white/10 transition focus:outline-none"
                                aria-label="Ingresar"
                            >
                                <User className="w-6 h-6" />
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
                            <div className={`w-6 h-0.5 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
                            <div className={`w-6 h-0.5 bg-gray-800 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                            <div className={`w-6 h-0.5 bg-gray-800 transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`min-[856px]:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="py-4 space-y-4">
                        <li>
                            <form
                                onSubmit={(e) => { onSearchSubmit(e); setIsMenuOpen(false); }}
                                className="flex items-center w-full rounded-md border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#254642] transition-colors"
                            >
                                <input
                                    id="search-mobile"
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar productos..."
                                    className="w-full bg-transparent pl-3 py-2 outline-none text-gray-900 [&::-webkit-search-cancel-button]:appearance-none"
                                />
                                {q && (
                                    <button
                                        type="button"
                                        onClick={() => setQ("")}
                                        className="!px-0.5 text-gray-400 hover:text-gray-600 transition-colors !border-none focus:outline-none h-full flex items-center justify-center"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="!px-2 text-gray-500 hover:text-[#254642] transition-colors !border-none focus:outline-none h-full flex items-center justify-center"
                                    aria-label="Buscar"
                                >
                                    <Search className="h-5 w-5" />
                                </button>
                            </form>
                        </li>

                        {isAuthenticated && isAdmin && (
                            <li>
                                <Link
                                    href="/admin"
                                    className="block text-gray-700 hover:text-gray-900 transition font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    🔧 Panel Admin
                                </Link>
                            </li>
                        )}

                        <li>
                            <div className="flex flex-col items-center gap-3 w-full">
                                <div className="flex flex-row items-center gap-3 flex-wrap w-full">
                                    {/* Sobre Nosotros Button */}
                                    <Link
                                        href="/nosotros"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="inline-flex items-center justify-center h-10 px-3 rounded-xl text-white border border-white/60 bg-transparent hover:bg-white/10 transition whitespace-nowrap flex-1"
                                    >
                                        Sobre Nosotros
                                    </Link>

                                    {/* Cart Button */}
                                    <button
                                        type="button"
                                        onClick={handleCartClick}
                                        className="inline-flex items-center justify-center h-10 px-3 rounded-xl text-white border border-white/60 bg-transparent hover:bg-white/10 transition relative"
                                        aria-label="Ir al carrito"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        {mounted && totalQty > 0 && (
                                            <span className="absolute -top-2 -right-2 text-xs bg-green-600 text-white rounded-full w-5 h-5 grid place-items-center">
                                                {totalQty}
                                            </span>
                                        )}
                                    </button>

                                    {/* User Button (Login/Logout) */}
                                    {isAuthenticated ? (
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="inline-flex items-center justify-center h-10 px-3 rounded-xl text-white border border-white/60 bg-transparent hover:bg-white/10 transition"
                                            aria-label="Cerrar sesión"
                                        >
                                            <User className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsAuthModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="inline-flex items-center justify-center h-10 px-3 rounded-xl text-white border border-white/60 bg-transparent hover:bg-white/10 transition"
                                            aria-label="Ingresar"
                                        >
                                            <User className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Buy Now Button */}
                                <button
                                    onClick={() => { router.push('/'); setIsMenuOpen(false); }}
                                    className="bg-[#D4AF37] text-[#254642] px-6 h-10 rounded-lg hover:bg-[#DAA520] transition font-semibold flex items-center justify-center focus:outline-none whitespace-nowrap w-full"
                                >
                                    Comprar Ahora
                                </button>
                            </div>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Auth Modal */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </header>
    );
}
