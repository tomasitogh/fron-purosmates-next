'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { registerUser } from '@/redux/authSlice';
import { RootState } from '@/redux/store';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+54');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login: authLogin } = useAuth();
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!email || !password) {
        toast.error('Completa email y contraseña');
        return;
      }

      try {
        const result = await authLogin(email, password);

        if (result.success) {
          toast.success('¡Login exitoso!');
          onClose();

          if (result.user.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/');
          }

          setEmail('');
          setPassword('');
        } else {
          toast.error(result.error || 'Error en el login');
        }
      } catch (error) {
        console.error('Error de red:', error);
        toast.error('Error de red. ¿Está levantado el backend en localhost:8080?');
      }
    } else {
      if (!name || !lastname || !email || !password || !phoneNumber) {
        toast.error('Completa todos los campos obligatorios');
        return;
      }

      if (name.length < 2 || name.length > 50) {
        toast.error('El nombre debe tener entre 2 y 50 caracteres');
        return;
      }

      if (lastname.length < 2 || lastname.length > 50) {
        toast.error('El apellido debe tener entre 2 y 50 caracteres');
        return;
      }

      if (phoneNumber.length < 6) {
        toast.error('Ingresa un número de teléfono válido');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 100) {
        toast.error('Por favor ingresa un email válido');
        return;
      }

      if (password.length < 6 || password.length > 100) {
        toast.error('La contraseña debe tener entre 6 y 100 caracteres');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      try {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`;
        await dispatch(registerUser({
          firstname: name,
          lastname: lastname,
          email: email,
          phoneNumber: fullPhoneNumber,
          password: password
        }) as any).unwrap();

        const result = await authLogin(email, password);
        if (result.success) {
          toast.success('¡Registro exitoso! Has sido logueado automáticamente.');
          onClose();
          router.push('/');
        } else {
          toast.success('¡Registro exitoso! Por favor inicia sesión.');
          setIsLogin(true);
        }

        setName('');
        setLastname('');
        setEmail('');
        setPhoneNumber('');
        setCountryCode('+54');
        setPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error('Error en registro:', error);
        let errorMessage = 'Error en el registro';
        if (error.message) {
          if (error.message.toLowerCase().includes('duplicate') ||
            error.message.toLowerCase().includes('already exists') ||
            error.message.toLowerCase().includes('constraint') ||
            error.message.toLowerCase().includes('unique')) {
            errorMessage = 'El email o nombre de usuario ya está registrado. Por favor usa otro.';
          } else if (error.message.toLowerCase().includes('400')) {
            errorMessage = 'Datos inválidos. Verifica la información ingresada.';
          } else {
            errorMessage = error.message;
          }
        }
        toast.error(errorMessage);
      }
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

        <div className="w-full md:w-[30%] h-[350px] md:h-auto bg-gradient-to-br from-[#2d5d52]/10 to-[#2d5d52]/20 flex items-center justify-center relative shrink-0">
          <Image
            src="/fondo-tandil.webp"
            alt="Mate"
            fill
            className="object-cover object-bottom"
          />
          <div className="absolute inset-0 bg-black/40 md:bg-transparent"></div>
        </div>

        <div className="w-full md:w-[70%] p-6 md:p-12 flex flex-col justify-start md:justify-center pt-8 md:pt-12">
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-3xl font-bold text-[#2d5d52] mb-3">
              {isLogin ? '¡Bienvenido a Puros Mates!' : '¡Creá tu cuenta!'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isLogin
                ? 'Para acceder a tus compras te pedimos que ingreses con tu cuenta.'
                : 'Registrate para poder realizar tus compras y acceder a todas las funcionalidades.'}
            </p>

            <div className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                    <input
                      type="text"
                      value={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      placeholder="Tu apellido"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (WhatsApp)</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+598">🇺🇾 +598</option>
                        <option value="+56">🇨🇱 +56</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+595">🇵🇾 +595</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="11 1234 5678"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Te contactaremos por aquí para coordinar el envío.</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2d5d52] focus:border-transparent outline-none transition-all"
                  />
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#2d5d52] text-white py-3 rounded-lg font-semibold hover:bg-[#2d5d52]/90 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : (isLogin ? 'Log In' : 'Registrarse')}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  {isLogin ? '¿No tenés una cuenta? ' : '¿Ya tenés una cuenta? '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[#2d5d52] hover:text-[#2d5d52]/80 font-semibold hover:underline"
                  >
                    {isLogin ? 'Registrate' : 'Iniciá sesión'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
