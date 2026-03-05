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
    createPreference,
    toggleCustomization
} from "@/redux/cartSlice";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import PaymentMethodModal from "@/components/PaymentMethodModal";
import { AppDispatch } from "@/redux/store";
import { Minus, Plus, Trash2, Copy } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import ProductModal from "@/components/ProductModal";


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
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mp' | 'transfer'>('cash');
    const [guestData, setGuestData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: ''
    });
    const [mounted, setMounted] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);


    useEffect(() => {
        setMounted(true);
    }, []);

    const handleConfirmCart = () => {
        setShowCheckout(true);
        // Scroll to checkout section
        setTimeout(() => {
            document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleFinalizePurchase = async () => {
        // Validation
        if (!isAuthenticated && (!guestData.phone || !guestData.email)) {
            toast.error('El número de teléfono y el email son obligatorios para coordinar el envío y enviar el comprobante.');
            return;
        }

        try {
            const orderData = {
                items,
                token: isAuthenticated ? token || undefined : undefined,
                guestData: {
                    guestPhone: guestData.phone,
                    ...(!isAuthenticated ? {
                        guestFirstname: guestData.firstname,
                        guestLastname: guestData.lastname,
                        guestEmail: guestData.email,
                    } : {})
                },
                paymentMethod // We will pass this to backend if updated, allows discount logic
            };

            // Note: Currently backend might not handle paymentMethod for discount automatically 
            // without further changes, but we will send the order.
            // Actually, we should handle the redirect/logic here based on payment method.

            const resultAction = await dispatch(createOrder(orderData));

            if (createOrder.fulfilled.match(resultAction)) {
                const order = resultAction.payload;

                if (paymentMethod === 'mp') {
                    const loadingToast = toast.loading('Generando pago...');
                    try {
                        const prefResult = await dispatch(createPreference({ orderId: order.id, token: token || '' }));

                        toast.dismiss(loadingToast);

                        if (createPreference.fulfilled.match(prefResult)) {
                            // Redirigir a Mercado Pago
                            window.location.href = prefResult.payload;
                        } else {
                            console.error('Error createPreference:', prefResult.payload || prefResult.error);
                            if (typeof prefResult.payload === 'string') {
                                toast.error(`Error: ${prefResult.payload}`);
                            } else {
                                toast.error('Error al generar pago con Mercado Pago. Intente nuevamente.');
                            }
                        }
                    } catch (error) {
                        toast.dismiss(loadingToast);
                        console.error('Error createPreference catch:', error);
                        toast.error('Ocurrió un error inesperado al generar el pago.');
                    }
                } else if (paymentMethod === 'transfer') {
                    // Show Success and Instructions?
                    // User said: "abajo aparece un mensaje chiquito... podes transferir..."
                    // The instructions are already visible in the form.
                    // Just confirm order.
                    toast.success('Pedido realizado con éxito. ¡Gracias!');
                    router.push(`/compra-exitosa?orderId=${order.id}`);
                } else {
                    // Cash
                    // WhatsApp redirect?
                    const phoneNumber = '5491130548207';
                    const message = `Hola, realicé el pedido #${order.id} (Efectivo).`;
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    toast.success('Pedido realizado. Redirigiendo a WhatsApp...');
                    router.push(`/compra-exitosa?orderId=${order.id}`);
                }

                dispatch({ type: 'cart/clearCart' }); // Manually clear or handle via slice
            } else {
                toast.error('Error al crear la orden');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ocurrió un error');
        }
    };

    // Calculate display total with discount
    const displayTotal = (paymentMethod === 'cash' || paymentMethod === 'transfer')
        ? totalPrice * 0.9
        : totalPrice;

    if (!mounted) {
        return null;
    }

    // ... (rendering)

    if (totalQty === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Tu Carrito</h1>
                    <p className="text-gray-600 mb-8">Tu carrito está vacío</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#D4AF37] text-[#254642] px-6 py-3 rounded-lg hover:bg-[#DAA520] transition font-semibold"
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
                        <div key={`${item.id}-${item.hasCustomization}`} className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div
                                className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                                onClick={() => setSelectedProduct(item)}
                            >
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
                                <div className="flex flex-col">
                                    <p className="text-gray-600">
                                        Base: ${item.price?.toFixed(2)}
                                    </p>
                                    {item.isCustomizable && (
                                        <div className="flex items-center mt-1">
                                            <input
                                                type="checkbox"
                                                id={`customization-${item.id}-${item.hasCustomization}`}
                                                checked={item.hasCustomization || false}
                                                onChange={() => dispatch(toggleCustomization({ id: item.id, hasCustomization: !item.hasCustomization }))}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer mr-2"
                                            />
                                            <label htmlFor={`customization-${item.id}-${item.hasCustomization}`} className="text-sm text-gray-600 cursor-pointer select-none">
                                                Personalizado (+${item.customizationCost?.toFixed(2)})
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                    <button
                                        onClick={() => dispatch(decrementItem({ id: item.id, hasCustomization: item.hasCustomization }))}
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
                                    Subtotal: ${((item.price + ((item.hasCustomization && item.customizationCost) ? item.customizationCost : 0)) * item.qty).toFixed(2)}
                                </p>
                                <button
                                    onClick={() => dispatch(removeItem({ id: item.id, hasCustomization: item.hasCustomization }))}
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
                            onClick={handleConfirmCart}
                            className="w-full bg-[#D4AF37] text-[#254642] px-6 py-3 rounded-lg hover:bg-[#DAA520] transition font-semibold mb-3"
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

            {/* CHECKOUT FORM */}
            {showCheckout && (
                <div id="checkout-section" className="mt-8 bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Finalizar Compra</h2>

                    {/* Subtítulo 1: Método de pago */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Método de pago</h3>
                        <div className="space-y-4">
                            {/* Efectivo */}
                            <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cash"
                                    checked={paymentMethod === 'cash'}
                                    onChange={() => setPaymentMethod('cash')}
                                    className="mt-1 w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Efectivo </span>
                                    <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-0.5 rounded ml-2">10% OFF</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        El vendedor se comunicará con vos para coordinar el pago y el envío.
                                    </p>
                                </div>
                            </label>

                            {/* Mercado Pago */}
                            <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="mp"
                                    checked={paymentMethod === 'mp'}
                                    onChange={() => setPaymentMethod('mp')}
                                    className="mt-1 w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Mercado Pago</span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        El vendedor se comunicará con vos para coordinar el envío.
                                    </p>
                                </div>
                            </label>

                            {/* Transferencia */}
                            <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="transfer"
                                    checked={paymentMethod === 'transfer'}
                                    onChange={() => setPaymentMethod('transfer')}
                                    className="mt-1 w-4 h-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <div>
                                    <span className="font-medium text-gray-800">Transferencia bancaria </span>
                                    <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-0.5 rounded ml-2">10% OFF</span>
                                    {paymentMethod === 'transfer' && (
                                        <div className="mt-3 bg-gray-50 p-4 rounded-md border border-gray-200 text-sm text-gray-700">
                                            <p className="mb-2">El alias a transferir es:</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <code className="bg-gray-200 px-2 py-1 rounded font-mono font-bold">puros.mates2026</code>
                                                <button onClick={() => { navigator.clipboard.writeText('puros.mates2026'); toast.success('Copiado'); }} className="text-gray-500 hover:text-gray-700">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p>
                                                Podes transferir y luego enviar el comprobante a{' '}
                                                <a href="https://wa.me/5491130548207" target="_blank" rel="noopener noreferrer" className="!text-[#254642] font-semibold hover:underline">
                                                    nuestro WhatsApp
                                                </a>{' '}
                                                - 11 3054 8207 y nosotros te confirmamos el pedido, o sino podes confirmar el pedido y esperar a que el vendedor se comunique con vos para coordinar el pago y el envío.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Subtítulo 2: Datos personales */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Datos personales</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {!isAuthenticated && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo (Opcional)</label>
                                        <input
                                            type="text"
                                            value={guestData.firstname}
                                            onChange={(e) => setGuestData({ ...guestData, firstname: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="Tu nombre"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Obligatorio)</label>
                                        <input
                                            type="email"
                                            value={guestData.email}
                                            onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de teléfono (Obligatorio)</label>
                                <input
                                    type="tel"
                                    value={guestData.phone}
                                    onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                                    placeholder="Ej: 11 1234 5678"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Para coordinar el envío y pago.</p>
                            </div>
                        </div>
                    </div>

                    {/* Total y Comprar */}
                    <div className="border-t pt-6 flex flex-col items-end">
                        <div className="flex items-end gap-x-3 mb-6">
                            {(paymentMethod === 'cash' || paymentMethod === 'transfer') ? (
                                <>
                                    <div className="text-gray-400 line-through text-lg">
                                        ${totalPrice.toFixed(2)}
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        ${displayTotal.toFixed(2)}
                                    </div>
                                    <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-sm mb-1">
                                        10% OFF
                                    </span>
                                </>
                            ) : (
                                <div className="text-3xl font-bold text-gray-800">
                                    ${totalPrice.toFixed(2)}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleFinalizePurchase}
                            className="w-full sm:w-auto bg-[#D4AF37] text-[#254642] px-8 py-3 rounded-lg hover:bg-[#DAA520] transition font-bold text-lg shadow-lg"
                        >
                            Confirmar Compra
                        </button>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                />
            )}
        </div>
    );
}
