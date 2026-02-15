'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function CheckoutFailure() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <XCircle className="h-6 w-6 text-red-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Pago Fallido
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.
                    </p>

                    <div className="mt-6">
                        <button
                            onClick={() => router.push('/carrito')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2d5d52] hover:bg-[#2d5d52]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Volver al carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
