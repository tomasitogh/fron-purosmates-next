"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [orderId, setOrderId] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        // Try getting orderId
        let id = searchParams.get('orderId');
        if (!id) id = searchParams.get('external_reference');
        if (!id) id = searchParams.get('merchant_order_id');
        setOrderId(id);

        // Get status
        let st = searchParams.get('status');
        if (!st) st = searchParams.get('collection_status');
        setStatus(st);
    }, [searchParams]);

    const isFailure = status === 'failure' || status === 'rejected' || status === 'null'; // MP sometimes sends null string
    const isPending = status === 'pending' || status === 'in_process';
    const isSuccess = !isFailure && !isPending;

    const whatsappMessage = `Hola, mi orden #${orderId || 'desconocida'} tuvo un problema con el pago.`;
    const whatsappLink = `https://wa.me/5491130548207?text=${encodeURIComponent(whatsappMessage)}`;

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto">
            {isSuccess ? (
                <>
                    <div className="bg-green-100 p-4 rounded-full mb-6">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        ¡Tu compra fue realizada con éxito!
                    </h1>
                </>
            ) : (
                <>
                    <div className="bg-yellow-100 p-4 rounded-full mb-6">
                        <CheckCircle className="w-16 h-16 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        Tu orden de compra es la número <span className="text-[#2d5d52]">#{orderId}</span>, pero tu pago no se pudo acreditar.
                    </h1>
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg text-blue-600 hover:text-blue-800 font-semibold mb-8 underline decoration-2 underline-offset-4"
                    >
                        Comunicate por nuestro WhatsApp
                    </a>
                </>
            )}

            {isSuccess && (
                orderId ? (
                    <p className="text-xl text-gray-600 mb-8">
                        Tu orden de compra es el número <span className="font-bold text-[#2d5d52]">#{orderId}</span>
                    </p>
                ) : (
                    <p className="text-gray-600 mb-8">
                        Tu orden ha sido procesada correctamente.
                    </p>
                )
            )}

            <button
                onClick={() => router.push('/')}
                className="bg-[#D4AF37] text-[#2d5d52] px-8 py-3 rounded-lg hover:bg-[#DAA520] transition font-semibold shadow-lg mt-4"
            >
                Volver al inicio
            </button>
        </div>
    );
}

export default function PurchaseSuccessPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
