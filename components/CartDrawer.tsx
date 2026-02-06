'use client';

import { useSelector, useDispatch } from 'react-redux';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    selectCartItems,
    selectCartOpen,
    selectCartSubtotal,
    selectCartDiscount,
    selectCartTotalPrice,
    selectHasComboDiscount,
    setCartOpen,
    decrementItem,
    removeItem,
} from '@/redux/cartSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { addToCart } from '@/redux/cartSlice';

export default function CartDrawer() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const items = useSelector(selectCartItems);
    const isOpen = useSelector(selectCartOpen);
    const subtotal = useSelector(selectCartSubtotal);
    const discount = useSelector(selectCartDiscount);
    const total = useSelector(selectCartTotalPrice);
    const hasCombo = useSelector(selectHasComboDiscount);

    const handleClose = () => {
        dispatch(setCartOpen(false));
    };

    const handleCheckout = () => {
        handleClose();
        router.push('/carrito');
    };

    const handleIncrement = (item: any) => {
        dispatch(addToCart(item));
    };

    const handleDecrement = (id: number) => {
        dispatch(decrementItem(id));
    };

    const handleRemove = (id: number) => {
        dispatch(removeItem(id));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Carrito de Compras</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                        aria-label="Cerrar carrito"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b pb-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.imageUrls?.[0] && (
                                            <img
                                                src={item.imageUrls[0]}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            ${item.price.toLocaleString('es-AR')}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => handleDecrement(item.id)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                aria-label="Decrementar cantidad"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="text-sm font-medium w-8 text-center">
                                                {item.qty}
                                            </span>
                                            <button
                                                onClick={() => handleIncrement(item)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                disabled={item.qty >= item.stock}
                                                aria-label="Incrementar cantidad"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="ml-auto p-1 hover:bg-red-50 text-red-600 rounded"
                                                aria-label="Eliminar producto"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t p-4 space-y-3">
                        {/* Combo Discount */}
                        {hasCombo && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm text-green-800 font-medium">
                                    🎉 ¡Combo completo! 10% de descuento
                                </p>
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span>${subtotal.toLocaleString('es-AR')}</span>
                        </div>

                        {/* Discount */}
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Descuento:</span>
                                <span>-${discount.toLocaleString('es-AR')}</span>
                            </div>
                        )}

                        {/* Total */}
                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                            <span>Total:</span>
                            <span>${total.toLocaleString('es-AR')}</span>
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-[#2d5d52] text-white py-3 rounded-lg hover:bg-[#2d5d52]/90 transition font-semibold"
                        >
                            Ir a Pagar
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
