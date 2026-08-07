import React from 'react';
import { ShoppingBag, Banknote, X } from 'lucide-react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: string) => void;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectMethod,
}: PaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md scale-100 transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-800 hover:shadow-md"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 text-center">
          <h3 className="mb-2 text-2xl font-bold text-gray-800">Confirmar Compra</h3>
          <p className="text-gray-500">Selecciona tu método de pago preferido</p>
        </div>

        <div className="space-y-4">
          {/* Mercado Pago Option */}
          <button
            onClick={() => onSelectMethod('mercadopago')}
            className="group relative flex w-full items-center rounded-xl border-2 border-transparent bg-blue-50 p-4 transition-all duration-200 hover:border-blue-500 hover:bg-blue-100"
          >
            <div className="mr-4 rounded-lg bg-blue-500 p-3 text-white transition-transform group-hover:scale-110">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-gray-800">Mercado Pago</div>
              <div className="text-sm text-gray-500">Tarjetas, débito y dinero en cuenta</div>
            </div>
          </button>

          {/* Cash Option */}
          <button
            onClick={() => onSelectMethod('cash')}
            className="group relative flex w-full items-center rounded-xl border-2 border-transparent bg-green-50 p-4 transition-all duration-200 hover:border-green-500 hover:bg-green-100"
          >
            <div className="mr-4 rounded-lg bg-green-600 p-3 text-white transition-transform group-hover:scale-110">
              <Banknote className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold text-gray-800">Efectivo / Transferencia</div>
              <div className="text-sm text-gray-500">Coordinar pago por WhatsApp</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full rounded-lg py-3 font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
