'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

export default function CheckoutPending() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 text-center shadow sm:rounded-lg sm:px-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">Pago Pendiente</h2>

          <p className="mb-6 text-gray-600">
            Tu pago está siendo procesado. Te notificaremos cuando se complete.
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
