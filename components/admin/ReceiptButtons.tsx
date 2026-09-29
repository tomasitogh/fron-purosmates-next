'use client';

import { useState } from 'react';
import { Download, Eye, FileText, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  downloadReceipt,
  getReceiptFilename,
  getReceiptViewUrl,
  isReceiptPdf,
} from '@/lib/receipts';

/** Toast específico cuando Cloudinary rechaza un comprobante viejo (401). */
function toastDownloadError(err: unknown) {
  const msg = err instanceof Error ? err.message : '';
  if (msg.startsWith('CLOUDINARY_401')) {
    toast.error(
      'Cloudinary no autorizó este comprobante viejo (401). Subí el PDF de nuevo para probar el flujo actual.',
      { duration: 6000 }
    );
  } else {
    toast.error('No se pudo descargar el comprobante');
  }
}

/* ------------------------------------------------------------------ */
/* Modal de vista previa: el comprobante se ve DENTRO de la app, sin   */
/* navegar a res.cloudinary.com (eso dejaba una página negra en iOS).  */
/* ------------------------------------------------------------------ */
export function ReceiptPreviewModal({
  orderId,
  receiptUrl,
  onClose,
}: {
  orderId: number;
  receiptUrl: string;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const filename = getReceiptFilename(orderId, receiptUrl);
  const isPdf = isReceiptPdf(receiptUrl);
  // Vista previa con la URL directa de Cloudinary (el navegador manda el
  // Referer real). No pasamos por el proxy para ver: así un 401 del proxy
  // nunca te deja sin preview, y el modal evita la página negra de iOS.
  const previewSrc = getReceiptViewUrl(receiptUrl);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceipt(receiptUrl, filename);
    } catch (err) {
      toastDownloadError(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Comprobante del pedido ${orderId}`}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900">
              Comprobante · Pedido #{orderId}
            </h3>
            <p className="truncate text-xs text-gray-500">{filename}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar vista previa"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-gray-100 p-4">
          {isPdf ? (
            <iframe
              src={previewSrc}
              title={`Comprobante pedido ${orderId}`}
              className="h-[60vh] w-full rounded-lg border border-gray-200 bg-white"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={`Comprobante del pedido ${orderId}`}
              className="max-h-[60vh] w-auto max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
            />
          )}
        </div>

        <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <a
            href={previewSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Abrir en pestaña nueva
          </a>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#254642] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d3530] disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? 'Descargando…' : 'Descargar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Acciones compactas para la tabla (desktop) y las cards (mobile).    */
/* ------------------------------------------------------------------ */
export function ReceiptTableActions({
  orderId,
  receiptUrl,
  compact = false,
}: {
  orderId: number;
  receiptUrl: string;
  compact?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const filename = getReceiptFilename(orderId, receiptUrl);
  const btnClass = compact
    ? 'rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50'
    : 'rounded-full p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-900';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceipt(receiptUrl, filename);
    } catch (err) {
      toastDownloadError(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setPreviewOpen(true)}
        className="rounded-full p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-900"
        title="Ver comprobante de pago"
        aria-label={`Ver comprobante del pedido ${orderId}`}
      >
        <Eye className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`${btnClass} disabled:opacity-60`}
        title="Descargar comprobante de pago"
        aria-label={`Descargar comprobante del pedido ${orderId}`}
      >
        {downloading ? (
          <Loader2 className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} animate-spin`} />
        ) : (
          <Download className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        )}
      </button>
      {previewOpen && (
        <ReceiptPreviewModal
          orderId={orderId}
          receiptUrl={receiptUrl}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Bloque para el modal de detalle del pedido, con miniatura.          */
/* ------------------------------------------------------------------ */
export function ReceiptDetailCard({
  orderId,
  receiptUrl,
}: {
  orderId: number;
  receiptUrl: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const filename = getReceiptFilename(orderId, receiptUrl);
  const isPdf = isReceiptPdf(receiptUrl);
  const thumbSrc = isPdf ? null : getReceiptViewUrl(receiptUrl);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReceipt(receiptUrl, filename);
    } catch (err) {
      toastDownloadError(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="border-t border-gray-200 pt-3 sm:col-span-2">
        <p className="mb-2 text-xs tracking-wide text-gray-500 uppercase">
          Comprobante de pago adjunto
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          {thumbSrc ? (
            <button
              onClick={() => setPreviewOpen(true)}
              className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
              title="Ver comprobante ampliado"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc}
                alt={`Comprobante del pedido ${orderId}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600">
              <FileText className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{filename}</p>
            <p className="text-xs text-gray-500">{isPdf ? 'Documento PDF' : 'Imagen'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#254642] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1d3530] disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {downloading ? 'Descargando…' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {previewOpen && (
        <ReceiptPreviewModal
          orderId={orderId}
          receiptUrl={receiptUrl}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
