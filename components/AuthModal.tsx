'use client';

import { X } from 'lucide-react';
import { SignIn, SignUp } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [view, setView] = useState<'signIn' | 'signUp'>('signIn');
    const pathname = usePathname();

    // Close modal on route change
    useEffect(() => {
        onClose();
    }, [pathname]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#333333]/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] flex flex-col md:flex-row overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 z-[100] w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 text-[#333333] shadow-md transition-all border border-gray-200 cursor-pointer"
                    aria-label="Cerrar"
                >
                    <X size={18} strokeWidth={2.5} className="flex-shrink-0 !w-[18px] !h-[18px]" />
                </button>

                {/* Left Side - Image */}
                <div className="hidden md:block md:w-[45%] relative bg-gray-100">
                    <div className="absolute inset-0">
                        <Image 
                            src="/fondo-tandil.webp" 
                            alt="Puros Mates" 
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#254642]/10 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#254642]/60 to-transparent" />
                    </div>
                    <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                        <div className="flex items-center gap-3 mb-3">
                             <Image 
                                src="/logo-purosmates.png"
                                alt="Puros Mates"
                                width={32}
                                height={32}
                                className="rounded-full"
                             />
                             <h2 className="text-3xl font-bold text-white drop-shadow-md">Puros Mates</h2>
                        </div>
                        <p className="text-white/90 font-light text-sm drop-shadow-sm">
                            Los mejores mates artesanales de Argentina
                        </p>
                    </div>
                </div>

                {/* Right Side - Auth component */}
                <div className="w-full md:w-[55%] p-6 py-12 md:p-8 flex flex-col justify-center items-center overflow-y-auto min-h-[500px]">
                    
                    <div className="w-full max-w-[400px] flex flex-col items-center">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-[#254642] mb-2">¡Bienvenido a Puros Mates!</h2>
                            <p className="text-[#555555] text-sm">
                                {view === 'signIn' 
                                  ? 'Ingresá para acceder a tus compras.' 
                                  : 'Creá tu cuenta para empezar a comprar.'}
                            </p>
                        </div>

                        {view === 'signIn' ? (
                            <SignIn 
                                routing="hash"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full flex justify-center",
                                        cardBox: "!shadow-none !border-none !bg-transparent w-full",
                                        card: "!shadow-none !border-none !bg-transparent p-0 w-full !rounded-none",
                                        header: "!hidden",
                                        headerTitle: "!hidden",
                                        headerSubtitle: "!hidden",
                                        footer: "!hidden",
                                        footerAction: "!hidden",
                                        socialButtonsBlockButton: "border border-gray-300 text-[#333333] hover:bg-gray-50 rounded-lg h-11",
                                        socialButtonsBlockButtonText: "font-semibold text-sm",
                                        dividerLine: "bg-gray-300",
                                        dividerText: "text-[#555555] font-light",
                                        formFieldLabel: "text-[#333333] font-medium text-sm",
                                        formFieldInput: "border-gray-300 bg-white h-11 focus:ring-[#254642] focus:border-[#254642] rounded-lg",
                                        formButtonPrimary: "bg-[#254642] hover:bg-[#1C3632] text-white rounded-lg h-11 font-medium font-sans tracking-wide uppercase text-sm",
                                    }
                                }}
                            />
                        ) : (
                            <SignUp 
                                routing="hash"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full flex justify-center",
                                        cardBox: "!shadow-none !border-none !bg-transparent w-full",
                                        card: "!shadow-none !border-none !bg-transparent p-0 w-full !rounded-none",
                                        header: "!hidden",
                                        headerTitle: "!hidden",
                                        headerSubtitle: "!hidden",
                                        footer: "!hidden",
                                        footerAction: "!hidden",
                                        socialButtonsBlockButton: "border border-gray-300 text-[#333333] hover:bg-gray-50 rounded-lg h-11",
                                        socialButtonsBlockButtonText: "font-semibold text-sm",
                                        dividerLine: "bg-gray-300",
                                        dividerText: "text-[#555555] font-light",
                                        formFieldLabel: "text-[#333333] font-medium text-sm",
                                        formFieldInput: "border-gray-300 bg-white h-11 focus:ring-[#254642] focus:border-[#254642] rounded-lg",
                                        formButtonPrimary: "bg-[#254642] hover:bg-[#1C3632] text-white rounded-lg h-11 font-medium tracking-wide uppercase text-sm",
                                    }
                                }}
                            />
                        )}

                        <div className="mt-6 flex items-center justify-center gap-1 text-sm text-[#555555]">
                            {view === 'signIn' ? (
                                <>
                                    <span>¿No tienes una cuenta?</span>
                                    <button 
                                        onClick={() => setView('signUp')}
                                        className="text-[#254642] hover:text-[#1C3632] font-semibold hover:underline"
                                    >
                                        Regístrate
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span>¿Ya tienes una cuenta?</span>
                                    <button 
                                        onClick={() => setView('signIn')}
                                        className="text-[#254642] hover:text-[#1C3632] font-semibold hover:underline"
                                    >
                                        Inicia sesión
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
