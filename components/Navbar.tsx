'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCartTotalQty, setCartOpen } from '@/redux/cartSlice';
import { useSession, signOut } from 'next-auth/react';
import AuthModal from './AuthModal';
import Image from 'next/image';
import { useDispatch } from 'react-redux';

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
        if (status !== 'authenticated') {
            setIsAuthModalOpen(true);
        } else {
            dispatch(setCartOpen(true));
        }
    };

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!q.trim()) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error("Ingresa texto para buscar", {
                    duration: 3000,
                    position: 'top-center',
                });
            });
            searchInputRef.current?.focus();
            return;
        }
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", q.trim());
        router.push(`/?${params.toString()}`);
    };

    const isAdmin = session?.user?.role === 'ADMIN';
    const isAuthenticated = status === 'authenticated';

    return (
        <header className="bg-[#2d5d52] shadow-md sticky top-0 z-50">
            <nav className="w-full px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo-purosmates.png"
                                alt="Puros Mates"
                                width={40}
                                height={40}
                                className="object-contain rounded-full"
                                priority
                            />
                        </Link>
                        <Link
                            href="/"
                            className="text-xl font-semibold tracking-wide text-[#F5F5DC]"
                        >
                            PUROS MATES
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden min-[856px]:flex flex-row items-center gap-4 flex-wrap">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-[#F5F5DC] border border-[#F5F5DC]/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 transition"
                        >
                            Productos
                        </Link>

                        {/* Barra de búsqueda */}
                        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
                            <input
                                id="search-desktop"
                                ref={searchInputRef}
                                type="search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Buscar productos…"
                                aria-label="Buscar productos"
                                className="w-56 rounded-xl border border-white/40 bg-white/10 px-3 py-1.5 text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-[#F5F5DC] border border-[#F5F5DC]/40 bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 transition"
                            >
                                Buscar
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={handleCartClick}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-[#F5F5DC] border border-[#F5F5DC]/40 bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 transition relative"
                            aria-label="Ir al carrito"
                        >
                            🛒
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
                                <span className="text-[#F5F5DC] font-medium">
                                    Hola, {session?.user?.name || session?.user?.email || 'Usuario'}
                                </span>
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
                                className="inline-flex items-center justify-center h-10 px-6 rounded-xl font-bold bg-[#F5F5DC] text-[#2d5d52] hover:bg-[#F5F5DC]/90 transition shadow-md"
                            >
                                Ingresar
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
                                className="flex items-center gap-2"
                            >
                                <input
                                    id="search-mobile"
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar productos…"
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#2d5d52]"
                                />
                                <button
                                    type="submit"
                                    className="block text-white hover:text-white- transition"
                                >
                                    Buscar
                                </button>
                            </form>
                        </li>

                        <li>
                            <button
                                type="button"
                                onClick={handleCartClick}
                                className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-white border border-white/60 bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition w-full relative"
                                aria-label="Ir al carrito"
                            >
                                🛒 Carrito
                                {mounted && totalQty > 0 && (
                                    <span className="absolute -top-2 -right-3 text-xs bg-green-600 text-white rounded-full w-5 h-5 grid place-items-center">
                                        {totalQty}
                                    </span>
                                )}
                            </button>
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
                            {isAuthenticated ? (
                                <div className="space-y-2">
                                    <span className="block text-gray-700 font-medium">
                                        Hola, {session?.user?.name || session?.user?.email || 'Usuario'}
                                    </span>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm text-center"
                                    >
                                        Cerrar sesión
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsAuthModalOpen(true);
                                        setIsMenuOpen(false);
                                    }}
                                    className="inline-flex items-center justify-center h-10 px-4 rounded-xl font-medium text-white border border-white/60 bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition w-full text-center"
                                >
                                    Ingresar
                                </button>
                            )}
                        </li>

                        <li>
                            <button
                                onClick={() => { router.push('/'); setIsMenuOpen(false); }}
                                className="block bg-[#D4AF37] text-[#2d5d52] px-6 py-2 rounded-lg hover:bg-[#DAA520] transition font-semibold text-center w-full focus:outline-none"
                            >
                                Comprar Ahora
                            </button>
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
