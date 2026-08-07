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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#333333]/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-[100] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-[#333333] shadow-md transition-all hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <X size={18} strokeWidth={2.5} className="!h-[18px] !w-[18px] flex-shrink-0" />
        </button>

        {/* Left Side - Image */}
        <div className="relative hidden bg-gray-100 md:block md:w-[45%]">
          <div className="absolute inset-0">
            <Image src="/fondo-tandil.webp" alt="Puros Mates" fill className="object-cover" />
            <div className="absolute inset-0 bg-[#254642]/10 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#254642]/60 to-transparent" />
          </div>
          <div className="relative z-10 flex h-full flex-col justify-end p-8">
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/logo-purosmates.png"
                alt="Puros Mates"
                width={32}
                height={32}
                className="rounded-full"
              />
              <h2 className="text-3xl font-bold text-white drop-shadow-md">Puros Mates</h2>
            </div>
            <p className="text-sm font-light text-white/90 drop-shadow-sm">
              Los mejores mates artesanales de Argentina
            </p>
          </div>
        </div>

        {/* Right Side - Auth component */}
        <div className="flex min-h-[500px] w-full flex-col items-center justify-center overflow-y-auto p-6 py-12 md:w-[55%] md:p-8">
          <div className="flex w-full max-w-[400px] flex-col items-center">
            <div className="mb-6 text-center">
              <h2 className="mb-2 text-2xl font-bold text-[#254642]">¡Bienvenido a Puros Mates!</h2>
              <p className="text-sm text-[#555555]">
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
                    rootBox: 'w-full flex justify-center',
                    cardBox: '!shadow-none !border-none !bg-transparent w-full',
                    card: '!shadow-none !border-none !bg-transparent p-0 w-full !rounded-none',
                    header: '!hidden',
                    headerTitle: '!hidden',
                    headerSubtitle: '!hidden',
                    footer: '!hidden',
                    footerAction: '!hidden',
                    socialButtonsBlockButton:
                      'border border-gray-300 text-[#333333] hover:bg-gray-50 rounded-lg h-11',
                    socialButtonsBlockButtonText: 'font-semibold text-sm',
                    dividerLine: 'bg-gray-300',
                    dividerText: 'text-[#555555] font-light',
                    formFieldLabel: 'text-[#333333] font-medium text-sm',
                    formFieldInput:
                      'border-gray-300 bg-white h-11 focus:ring-[#254642] focus:border-[#254642] rounded-lg',
                    formButtonPrimary:
                      'bg-[#254642] hover:bg-[#1C3632] text-white rounded-lg h-11 font-medium font-sans tracking-wide uppercase text-sm',
                  },
                }}
              />
            ) : (
              <SignUp
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: 'w-full flex justify-center',
                    cardBox: '!shadow-none !border-none !bg-transparent w-full',
                    card: '!shadow-none !border-none !bg-transparent p-0 w-full !rounded-none',
                    header: '!hidden',
                    headerTitle: '!hidden',
                    headerSubtitle: '!hidden',
                    footer: '!hidden',
                    footerAction: '!hidden',
                    socialButtonsBlockButton:
                      'border border-gray-300 text-[#333333] hover:bg-gray-50 rounded-lg h-11',
                    socialButtonsBlockButtonText: 'font-semibold text-sm',
                    dividerLine: 'bg-gray-300',
                    dividerText: 'text-[#555555] font-light',
                    formFieldLabel: 'text-[#333333] font-medium text-sm',
                    formFieldInput:
                      'border-gray-300 bg-white h-11 focus:ring-[#254642] focus:border-[#254642] rounded-lg',
                    formButtonPrimary:
                      'bg-[#254642] hover:bg-[#1C3632] text-white rounded-lg h-11 font-medium tracking-wide uppercase text-sm',
                  },
                }}
              />
            )}

            <div className="mt-6 flex items-center justify-center gap-1 text-sm text-[#555555]">
              {view === 'signIn' ? (
                <>
                  <span>¿No tienes una cuenta?</span>
                  <button
                    onClick={() => setView('signUp')}
                    className="font-semibold text-[#254642] hover:text-[#1C3632] hover:underline"
                  >
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  <span>¿Ya tienes una cuenta?</span>
                  <button
                    onClick={() => setView('signIn')}
                    className="font-semibold text-[#254642] hover:text-[#1C3632] hover:underline"
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
