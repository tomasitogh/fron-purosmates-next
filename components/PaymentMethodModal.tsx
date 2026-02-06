import React from 'react';
import { ShoppingBag, Banknote, X } from 'lucide-react';

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMethod: (method: string) => void;
}

export default function PaymentMethodModal({ isOpen, onClose, onSelectMethod }: PaymentMethodModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-50 hover:shadow-md transition-all shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Compra</h3>
                    <p className="text-gray-500">Selecciona tu método de pago preferido</p>
                </div>

                <div className="space-y-4">
                    {/* Mercado Pago Option */}
                    <button
                        onClick={() => onSelectMethod('mercadopago')}
                        className="w-full group relative flex items-center bg-blue-50 hover:bg-blue-100 border-2 border-transparent hover:border-blue-500 rounded-xl p-4 transition-all duration-200"
                    >
                        <div className="bg-blue-500 text-white p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 text-lg">Mercado Pago</div>
                            <div className="text-sm text-gray-500">Tarjetas, débito y dinero en cuenta</div>
                        </div>
                    </button>

                    {/* Cash Option */}
                    <button
                        onClick={() => onSelectMethod('cash')}
                        className="w-full group relative flex items-center bg-green-50 hover:bg-green-100 border-2 border-transparent hover:border-green-500 rounded-xl p-4 transition-all duration-200"
                    >
                        <div className="bg-green-600 text-white p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 text-lg">Efectivo / Transferencia</div>
                            <div className="text-sm text-gray-500">Coordinar pago por WhatsApp</div>
                        </div>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mt-8 w-full py-3 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
