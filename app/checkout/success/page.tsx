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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        ¡Pago Exitoso!
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Gracias por tu compra. Tu pedido ha sido procesado correctamente.
                        {paymentId && <span className="block mt-2 text-sm text-gray-500">ID de pago: {paymentId}</span>}
                    </p>

                    <div className="mt-6">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#254642] hover:bg-[#254642]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
