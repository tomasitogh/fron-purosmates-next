'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      toast.error('Error al conectar con Google');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl flex flex-col md:flex-row max-w-5xl w-full max-h-[90vh] overflow-y-auto md:overflow-hidden relative my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
          <Image
            src="/logo-purosmates.png"
            alt="Puros Mates"
            width={32}
            height={32}
            className="rounded-full bg-white/20 backdrop-blur-sm p-1"
          />
          <span className="text-xl font-bold text-white drop-shadow-md">Puros Mates</span>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:shadow-md transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-[30%] h-[350px] md:h-auto bg-gradient-to-br from-[#2d5d52]/10 to-[#2d5d52]/20 flex items-center justify-center relative shrink-0 overflow-hidden">
          <Image
            src="/fondo-tandil.webp"
            alt="Mate"
            fill
            sizes="(max-width: 768px) 100vw, 30vw"
            className="object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-black/40 md:bg-transparent"></div>
        </div>

        <div className="w-full md:w-[70%] p-6 md:p-12 flex flex-col justify-start md:justify-center pt-8 md:pt-12">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-[#2d5d52] mb-3">
              ¡Bienvenido a Puros Mates!
            </h2>
            <p className="text-gray-600 mb-8">
              Ingresá con tu cuenta de Google para acceder a tus compras.
            </p>

            {/* Botón de Google */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md mb-6"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.8055 10.2292C19.8055 9.55155 19.7501 8.86906 19.6319 8.20312H10.2002V12.0492H15.6014C15.377 13.2911 14.6571 14.3898 13.6025 15.0879V17.5866H16.8254C18.712 15.8449 19.8055 13.2728 19.8055 10.2292Z" fill="#4285F4" />
                <path d="M10.2002 20.0006C12.9515 20.0006 15.2709 19.1151 16.8293 17.5865L13.6064 15.0879C12.7096 15.6979 11.5521 16.0433 10.2041 16.0433C7.54353 16.0433 5.28174 14.2833 4.48276 11.917H1.16309V14.4927C2.75559 17.8195 6.32095 20.0006 10.2002 20.0006Z" fill="#34A853" />
                <path d="M4.47891 11.9169C4.06172 10.6751 4.06172 9.32947 4.47891 8.08765V5.51196H1.16309C-0.260157 8.33674 -0.260157 11.6677 1.16309 14.4925L4.47891 11.9169Z" fill="#FBBC04" />
                <path d="M10.2002 3.95805C11.6248 3.936 13.0006 4.47247 14.0368 5.45722L16.8937 2.60218C15.1858 0.990984 12.9324 0.0932338 10.2002 0.11937C6.32095 0.11937 2.75559 2.30045 1.16309 5.51187L4.47891 8.08756C5.27404 5.71691 7.53969 3.95805 10.2002 3.95805Z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          </div>


        </div>
      </div>
    </div>

  );
}
