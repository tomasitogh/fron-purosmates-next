'use client';

import { useDispatch, useSelector } from "react-redux";
import {
    addToCart,
    decrementItem,
    removeItem,
    selectCartItems,
    selectCartTotalQty,
    selectCartTotalPrice,
    selectCartSubtotal,
    selectCartDiscount,
    selectHasComboDiscount,
    createOrder,
    createPreference
} from "@/redux/cartSlice";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import PaymentMethodModal from "@/components/PaymentMethodModal";
import { AppDispatch } from "@/redux/store";
import { Minus, Plus, Trash2 } from "lucide-react";
import AuthModal from "@/components/AuthModal";

export default function Carrito() {
    const dispatch = useDispatch<AppDispatch>();
    const items = useSelector(selectCartItems);
    const totalQty = useSelector(selectCartTotalQty);
    const totalPrice = useSelector(selectCartTotalPrice);
    const subtotal = useSelector(selectCartSubtotal);
    const discount = useSelector(selectCartDiscount);
    const hasComboDiscount = useSelector(selectHasComboDiscount);

    const router = useRouter();
    const { isAuthenticated, token } = useAuth();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // or a loading spinner
    }

    const handleCheckoutClick = () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para realizar la compra');
            setIsAuthModalOpen(true);
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSelection = async (method: string) => {
        setIsPaymentModalOpen(false);

        try {
            const resultAction = await dispatch(createOrder({ items, token: token! }));

            if (createOrder.fulfilled.match(resultAction)) {
                const order = resultAction.payload;

                if (method === 'cash') {
                    // WhatsApp Logic
                    const phoneNumber = '5491130548207';
                    const message = `Hola, tengo la orden #${order.id} y quiero pagar en efectivo.`;
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                    window.open(whatsappUrl, '_blank');
                    toast.success('Orden creada. Redirigiendo a WhatsApp...');
                } else {
                    // Mercado Pago Logic
                    toast.loading('Generando pago...');
                    const prefResult = await dispatch(createPreference({ orderId: order.id, token: token! }));

                    if (createPreference.fulfilled.match(prefResult)) {
                        const initPoint = prefResult.payload;
                        window.location.href = initPoint;
                    } else {
                        toast.error('Error al generar pago con Mercado Pago');
                    }
                }
            } else {
                toast.error('Error al crear la orden: ' + (resultAction.payload || 'Error desconocido'));
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado');
            console.error(error);
        }
    };

    if (totalQty === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu Carrito</h1>
                    <p className="text-gray-600 mb-8">Tu carrito está vacío</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#D4AF37] text-[#2d5d52] px-6 py-3 rounded-lg hover:bg-[#DAA520] transition font-semibold"
                    >
                        Ir a comprar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Tu Carrito</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lista de productos */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {item.images?.[0] ? (
                                    <img
                                        src={item.images[0].url}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        style={{
                                            transform: `scale(${item.images[0].scale || 1}) translate(${item.images[0].x || 0}%, ${item.images[0].y || 0}%)`,
                                            transformOrigin: 'center'
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                        <span className="text-xs">Sin img</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow text-center sm:text-left">
                                <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                                <p className="text-gray-600">${item.price?.toFixed(2)}</p>

                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                    <button
                                        onClick={() => dispatch(decrementItem(item.id))}
                                        className="p-2 hover:bg-gray-100 rounded transition"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-gray-800 font-medium px-4">{item.qty}</span>
                                    <button
                                        onClick={() => dispatch(addToCart(item))}
                                        className="p-2 hover:bg-gray-100 rounded transition"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0">
                                <p className="text-lg font-bold text-gray-800">
                                    Subtotal: ${(item.price * item.qty).toFixed(2)}
                                </p>
                                <button
                                    onClick={() => dispatch(removeItem(item.id))}
                                    className="text-red-600 hover:text-red-800 transition text-sm mt-2 flex items-center justify-center sm:justify-end w-full gap-1"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumen del pedido */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumen del Pedido</h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal ({totalQty} productos)</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>

                            {hasComboDiscount && (
                                <div className="flex justify-between text-green-600 font-semibold">
                                    <span>🎉 Descuento Combo (10%)</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {hasComboDiscount && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-800 font-medium">
                                    ✅ ¡Combo completo! Tienes Mate + Bombilla + Accesorio
                                </p>
                            </div>
                        )}

                        <div className="border-t pt-4 mb-4">
                            <div className="flex justify-between text-lg font-bold text-gray-800">
                                <span>Total</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckoutClick}
                            className="w-full bg-[#D4AF37] text-[#2d5d52] px-6 py-3 rounded-lg hover:bg-[#DAA520] transition font-semibold mb-3"
                        >
                            Confirmar carrito
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                        >
                            Seguir Comprando
                        </button>
                    </div>
                </div>
            </div>

            <PaymentMethodModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSelectMethod={handlePaymentSelection}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </div>
    );
}
