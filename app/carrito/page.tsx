'use client';

import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  decrementItem,
  removeItem,
  selectCartItems,
  selectCartTotalQty,
  selectCartTotalPrice,
  selectCartSubtotal,
  createOrder,
  // createPreference, // [DESHABILITADO] MP — no se usa hasta reactivar
  toggleCustomization,
} from '@/redux/cartSlice';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
// import PaymentMethodModal from "@/components/PaymentMethodModal"; // [DESHABILITADO] MP — no se usa hasta reactivar
import { AppDispatch } from '@/redux/store';
import { Minus, Plus, Trash2, Copy } from 'lucide-react';
import ProductModal, { Product } from '@/components/ProductModal';

export default function Carrito() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectCartItems);
  const totalQty = useSelector(selectCartTotalQty);
  const totalPrice = useSelector(selectCartTotalPrice);
  const subtotal = useSelector(selectCartSubtotal);

  const router = useRouter();
  const { isAuthenticated, getToken } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [guestData, setGuestData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    shippingPreference: 'vendedor',
    locality: '',
    address: '',
    floorApartment: '',
    extraIndications: '',
  });
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (isAuthenticated) {
      (async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/users/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = response.data;
          if (data) {
            setGuestData((prev) => ({
              ...prev,
              phone: data.phoneNumber || prev.phone,
              shippingPreference: data.shippingPreference || 'vendedor',
              locality: data.locality || '',
              address: data.address || '',
              floorApartment: data.floorApartment || '',
              extraIndications: data.extraIndications || '',
              // Extract firstname/lastname from name
              firstname: prev.firstname || (data.name ? data.name.split(' ')[0] : ''),
              lastname: prev.lastname || (data.name ? data.name.split(' ').slice(1).join(' ') : ''),
            }));
          }
        } catch (e) {
          console.error('Error fetching user data', e);
        }
      })();
    }
  }, [isAuthenticated, getToken]);

  const handleConfirmCart = () => {
    setShowCheckout(true);
    // Scroll to checkout section
    setTimeout(() => {
      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleFinalizePurchase = async () => {
    // Validation
    if (!guestData.firstname || !guestData.lastname || !guestData.phone) {
      toast.error('Nombre, apellido y teléfono son obligatorios.');
      return;
    }
    if (!isAuthenticated && !guestData.email) {
      toast.error('El email es obligatorio para continuar.');
      return;
    }
    if (guestData.shippingPreference === 'correo') {
      if (!guestData.locality || !guestData.address || !guestData.floorApartment) {
        toast.error(
          'Para envío por Correo Argentino, la localidad, dirección exacta y piso/departamento son obligatorios.'
        );
        return;
      }
    }

    try {
      const orderData = {
        items,
        getToken: isAuthenticated ? getToken : undefined,
        guestData: {
          guestPhone: guestData.phone,
          guestFirstname: guestData.firstname,
          guestLastname: guestData.lastname,
          shippingPreference: guestData.shippingPreference,
          locality: guestData.locality,
          address: guestData.address,
          floorApartment: guestData.floorApartment,
          extraIndications: guestData.extraIndications,
          ...(!isAuthenticated
            ? {
                guestEmail: guestData.email,
              }
            : {}),
        },
        paymentMethod, // We will pass this to backend if updated, allows discount logic
      };

      // Note: Currently backend might not handle paymentMethod for discount automatically
      // without further changes, but we will send the order.
      // Actually, we should handle the redirect/logic here based on payment method.

      const resultAction = await dispatch(createOrder(orderData));

      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;

        // [DESHABILITADO] MercadoPago — no se usa hasta reactivar MP
        // if (paymentMethod === 'mp') {
        //     const loadingToast = toast.loading('Generando pago...');
        //     try {
        //         const prefResult = await dispatch(createPreference({ orderId: order.id, getToken: isAuthenticated ? getToken : undefined }));
        //         toast.dismiss(loadingToast);
        //         if (createPreference.fulfilled.match(prefResult)) {
        //             window.location.href = prefResult.payload;
        //         } else {
        //             console.error('Error createPreference:', prefResult.payload || prefResult.error);
        //             if (typeof prefResult.payload === 'string') {
        //                 toast.error(`Error: ${prefResult.payload}`);
        //             } else {
        //                 toast.error('Error al generar pago con Mercado Pago. Intente nuevamente.');
        //             }
        //         }
        //     } catch (error) {
        //         toast.dismiss(loadingToast);
        //         console.error('Error createPreference catch:', error);
        //         toast.error('Ocurrió un error inesperado al generar el pago.');
        //     }
        // } else
        if (paymentMethod === 'transfer') {
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

  // [DESHABILITADO] Descuento por método de pago — precio final siempre es el total
  if (!mounted) {
    return null;
  }

  // ... (rendering)

  if (totalQty === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-800">Tu Carrito</h1>
          <p className="mb-8 text-gray-600">Tu carrito está vacío</p>
          <button
            onClick={() => router.push('/shop')}
            className="rounded-lg bg-[#D4AF37] px-6 py-3 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
          >
            Ir a comprar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-800">Tu Carrito</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Lista de productos — layout tipo prototipo:
                       [img-badge]   nombre           $precio
                                     variant
                                     [controles]                */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item, index) => {
            // G2: thumbnail usa variantImageUrl si está (foto del SKU
            // específico), sino la primera imagen del product.
            const thumbUrl = item.variantImageUrl ?? item.images?.[0]?.url;
            const thumbTransform = item.variantImageUrl
              ? null // las imágenes de variant no tienen transform del admin editor
              : item.images?.[0];
            // E7: chip con el `name` de la variant.
            const variantLabel = item.variantName || item.variantSku;
            return (
              <div
                key={`${item.variantId}-${!!item.hasCustomization}`}
                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm sm:p-5"
              >
                {/* Imagen con badge numerado */}
                <div
                  className="relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition hover:opacity-90 sm:h-24 sm:w-24"
                  onClick={() => setSelectedProduct(item)}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      style={
                        thumbTransform
                          ? {
                              transform: `scale(${thumbTransform.scale || 1}) translate(${thumbTransform.x || 0}%, ${thumbTransform.y || 0}%)`,
                              transformOrigin: 'center',
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <span className="text-xs">Sin img</span>
                    </div>
                  )}
                  {/* Badge numerado — esquina superior derecha */}
                  <div className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 shadow-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Centro: nombre + variant + controles */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{item.name}</p>
                  {variantLabel && (
                    <p className="truncate text-sm text-gray-500" title={item.variantSku}>
                      {variantLabel}
                    </p>
                  )}

                  {/* Controles: cantidad, personalizar, eliminar */}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 rounded-md border border-gray-200">
                      <button
                        onClick={() =>
                          dispatch(
                            decrementItem({
                              variantId: item.variantId,
                              hasCustomization: item.hasCustomization,
                            })
                          )
                        }
                        className="rounded-l-md p-1.5 transition hover:bg-gray-100"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 text-sm font-medium text-gray-800">{item.qty}</span>
                      <button
                        onClick={async () => {
                          const result = await dispatch(addToCart(item));
                          if (addToCart.rejected.match(result)) {
                            toast.error('Este producto no tiene stock disponible');
                          }
                        }}
                        disabled={item.qty >= item.variantStock}
                        className="rounded-r-md p-1.5 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {item.isCustomizable && (
                      <label className="flex cursor-pointer items-center gap-1.5 select-none">
                        <input
                          type="checkbox"
                          checked={item.hasCustomization || false}
                          onChange={() =>
                            dispatch(
                              toggleCustomization({
                                variantId: item.variantId,
                                hasCustomization: !item.hasCustomization,
                              })
                            )
                          }
                          className="h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">
                          Personalizado (+${item.customizationCost?.toLocaleString('es-AR')})
                        </span>
                      </label>
                    )}

                    <button
                      onClick={() =>
                        dispatch(
                          removeItem({
                            variantId: item.variantId,
                            hasCustomization: item.hasCustomization,
                          })
                        )
                      }
                      className="ml-auto flex items-center gap-1 text-xs text-red-600 transition hover:text-red-800"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Precio a la derecha */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-gray-900">${item.price.toLocaleString('es-AR')}</p>
                  {item.qty > 1 && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      x{item.qty} = ${(item.price * item.qty).toLocaleString('es-AR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-gray-800">Resumen del Pedido</h2>

            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalQty} productos)</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>

              {/* [DESHABILITADO] Descuento combo — hasta reactivar
                            {hasComboDiscount && (
                                <div className="flex justify-between text-green-600 font-semibold">
                                    <span>🎉 Descuento Combo (10%)</span>
                                    <span>-${discount.toLocaleString('es-AR')}</span>
                                </div>
                            )}
                            */}
            </div>

            {/* [DESHABILITADO] Banner combo — hasta reactivar
                        {hasComboDiscount && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-green-800 font-medium">
                                    ✅ ¡Combo aplicado! tenés Mate + Bombilla
                                </p>
                            </div>
                        )}
                        */}

            <div className="mb-4 border-t pt-4">
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>${totalPrice.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmCart}
              className="mb-3 w-full rounded-lg bg-[#D4AF37] px-6 py-3 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
            >
              Confirmar carrito
            </button>

            <button
              onClick={() => router.push('/shop')}
              className="w-full rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-300"
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT FORM */}
      {showCheckout && (
        <div
          id="checkout-section"
          className="mx-auto mt-8 max-w-4xl rounded-lg bg-white p-6 shadow-md"
        >
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Finalizar Compra</h2>

          {/* Subtítulo 1: Método de pago */}
          <div className="mb-12">
            <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
              Método de pago
            </h3>
            <div className="space-y-4">
              {/* Efectivo */}
              <label className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div>
                  <span className="font-medium text-gray-800">Efectivo </span>
                  {/* [DESHABILITADO] Badge descuento — hasta reactivar
                                    <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-0.5 rounded ml-2">10% OFF</span>
                                    */}
                  <p className="mt-1 text-sm text-gray-500">
                    El vendedor se comunicará con vos para coordinar el pago y el envío.
                  </p>
                </div>
              </label>

              {/* [DESHABILITADO] MercadoPago — no se muestra hasta reactivar
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
                            */}

              {/* Transferencia */}
              <label className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={() => setPaymentMethod('transfer')}
                  className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div>
                  <span className="font-medium text-gray-800">Transferencia bancaria </span>
                  {/* [DESHABILITADO] Badge descuento — hasta reactivar
                                    <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-0.5 rounded ml-2">10% OFF</span>
                                    */}

                  <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="mb-2">El alias a transferir es:</p>
                    <div className="mb-3 flex items-center gap-2">
                      <code className="rounded bg-gray-200 px-2 py-1 font-mono font-bold">
                        puros.mates2026
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('puros.mates2026');
                          toast.success('Copiado');
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p>
                      Podes transferir y luego enviar el comprobante a{' '}
                      <a
                        href="https://wa.me/5491130548207"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold !text-[#254642] hover:underline"
                      >
                        nuestro WhatsApp
                      </a>{' '}
                      - 11 3054 8207 y nosotros te confirmamos el pedido, o sino podes confirmar el
                      pedido y esperar a que el vendedor se comunique con vos para coordinar el pago
                      y el envío.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Preferencia de envío */}
          <div className="mb-8 border-b pb-8">
            <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
              Preferencia de envío
            </h3>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition hover:bg-gray-50">
                <input
                  type="radio"
                  name="shippingPreference"
                  value="correo"
                  checked={guestData.shippingPreference === 'correo'}
                  onChange={() => setGuestData({ ...guestData, shippingPreference: 'correo' })}
                  className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div>
                  <span className="font-medium text-gray-800">Correo Argentino</span>
                  <p className="mt-1 text-sm text-gray-500">Envíos a todo el país.</p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition hover:bg-gray-50">
                <input
                  type="radio"
                  name="shippingPreference"
                  value="vendedor"
                  checked={guestData.shippingPreference === 'vendedor'}
                  onChange={() => setGuestData({ ...guestData, shippingPreference: 'vendedor' })}
                  className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div>
                  <span className="font-medium text-gray-800">Me comunico con el vendedor</span>
                  <p className="mt-1 text-sm text-gray-500">
                    Coordinar un punto de retiro con el vendedor.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Subtítulo 2: Datos personales */}
          <div className="mb-8">
            <h3 className="margin mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
              Datos personales
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre (Obligatorio)
                </label>
                <input
                  type="text"
                  value={guestData.firstname}
                  onChange={(e) => setGuestData({ ...guestData, firstname: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Apellido (Obligatorio)
                </label>
                <input
                  type="text"
                  value={guestData.lastname}
                  onChange={(e) => setGuestData({ ...guestData, lastname: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  placeholder="Tu apellido"
                  required
                />
              </div>

              {!isAuthenticated && (
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email (Obligatorio)
                  </label>
                  <input
                    type="email"
                    value={guestData.email}
                    onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Número de teléfono (Obligatorio)
                </label>
                <input
                  type="tel"
                  value={guestData.phone}
                  onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                  placeholder="Ej: 11 1234 5678"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Para coordinar el envío y pago.</p>
              </div>

              {guestData.shippingPreference === 'correo' && (
                <>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Localidad (Obligatorio)
                    </label>
                    <input
                      type="text"
                      value={guestData.locality}
                      onChange={(e) => setGuestData({ ...guestData, locality: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      placeholder="Ej: Córdoba Capital"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Dirección exacta (Obligatorio)
                    </label>
                    <input
                      type="text"
                      value={guestData.address}
                      onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      placeholder="Ej: San Martín 123"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Piso y departamento (Obligatorio)
                    </label>
                    <input
                      type="text"
                      value={guestData.floorApartment}
                      onChange={(e) =>
                        setGuestData({ ...guestData, floorApartment: e.target.value })
                      }
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      placeholder="Ej: PB A"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Indicaciones extras
                    </label>
                    <input
                      type="text"
                      value={guestData.extraIndications}
                      onChange={(e) =>
                        setGuestData({ ...guestData, extraIndications: e.target.value })
                      }
                      className="w-full rounded-lg border px-3 py-2 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      placeholder="Ej: Tocar el timbre del medio"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Total y Comprar */}
          <div className="flex flex-col items-end border-t pt-6">
            <div className="mb-6 flex items-end gap-x-3">
              {/* [DESHABILITADO] Descuento por método de pago — hasta reactivar
                            {(paymentMethod === 'cash' || paymentMethod === 'transfer') ? (
                                <>
                                    <div className="text-gray-400 line-through text-lg">
                                        ${totalPrice.toLocaleString('es-AR')}
                                    </div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        ${displayTotal.toLocaleString('es-AR')}
                                    </div>
                                    <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-sm mb-1">
                                        10% OFF
                                    </span>
                                </>
                            ) : (
                                <div className="text-3xl font-bold text-gray-800">
                                    ${totalPrice.toLocaleString('es-AR')}
                                </div>
                            )}
                            */}
              <div className="text-3xl font-bold text-gray-800">
                ${totalPrice.toLocaleString('es-AR')}
              </div>
            </div>

            <button
              onClick={handleFinalizePurchase}
              className="w-full rounded-lg bg-[#D4AF37] px-8 py-3 text-lg font-bold text-[#254642] shadow-lg transition hover:bg-[#DAA520] sm:w-auto"
            >
              Confirmar Compra
            </button>
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
