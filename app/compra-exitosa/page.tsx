'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    searchParams.get('merchant_order_id') ||
    null;
  const status = searchParams.get('status') || searchParams.get('collection_status') || null;

  const isFailure = status === 'failure' || status === 'rejected' || status === 'null'; // MP sometimes sends null string
  const isPending = status === 'pending' || status === 'in_process';
  const isSuccess = !isFailure && !isPending;

  const whatsappMessage = `Hola, mi orden #${orderId || 'desconocida'} tuvo un problema con el pago.`;
  const whatsappLink = `https://wa.me/5491130548207?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      {isSuccess ? (
        <>
          <div className="mb-6 rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-800">
            ¡Tu compra fue realizada con éxito!
          </h1>
        </>
      ) : (
        <>
          <div className="mb-6 rounded-full bg-yellow-100 p-4">
            <CheckCircle className="h-16 w-16 text-yellow-600" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Tu orden de compra es la número <span className="text-[#254642]">#{orderId}</span>, pero
            tu pago no se pudo acreditar.
          </h1>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 text-lg font-semibold text-blue-600 underline decoration-2 underline-offset-4 hover:text-blue-800"
          >
            Comunicate por nuestro WhatsApp
          </a>
        </>
      )}

      {isSuccess &&
        (orderId ? (
          <p className="mb-8 text-xl text-gray-600">
            Tu orden de compra es el número{' '}
            <span className="font-bold text-[#254642]">#{orderId}</span>
          </p>
        ) : (
          <p className="mb-8 text-gray-600">Tu orden ha sido procesada correctamente.</p>
        ))}

      <button
        onClick={() => router.push('/')}
        className="mt-4 rounded-lg bg-[#D4AF37] px-8 py-3 font-semibold text-[#254642] shadow-lg transition hover:bg-[#DAA520]"
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
