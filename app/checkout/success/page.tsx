'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/redux/cartSlice';
import { CheckCircle } from 'lucide-react';
import { AppDispatch } from '@/redux/store';

function CheckoutSuccessContent() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Limpiar carrito al llegar a esta página si el pago fue exitoso
    dispatch(clearCart());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart_items');
    }
  }, [dispatch]);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 text-center shadow sm:rounded-lg sm:px-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Pago Exitoso!</h2>

          <p className="mb-6 text-gray-600">
            Gracias por tu compra. Tu pedido ha sido procesado correctamente.
            {paymentId && (
              <span className="mt-2 block text-sm text-gray-500">ID de pago: {paymentId}</span>
            )}
          </p>

          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="flex w-full justify-center rounded-md border border-transparent bg-[#254642] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#254642]/90 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
