'use client';

import Image from 'next/image';
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
import {
  Minus,
  Plus,
  Trash2,
  Copy,
  Upload,
  FileText,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import ProductModal, { Product } from '@/components/ProductModal';
import { generateSvgFromDesign } from '@/lib/customize/svg-generator';
import { DESIGN_STORAGE_KEY } from '@/components/customize/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [mateNotes, setMateNotes] = useState('');
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgPreviewImg, setSvgPreviewImg] = useState<string | null>(null);
  const [svgFileName, setSvgFileName] = useState<string | null>(null);

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

  useEffect(() => {
    if (!svgContent && items.some((item) => item.hasCustomization)) {
      try {
        const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
        if (raw) {
          const design = JSON.parse(raw);
          if (design.elements && design.elements.length > 0) {
            generateSvgFromDesign(design)
              .then((svg) => {
                setSvgContent(svg);
                setSvgFileName('Diseño del Personalizador');
              })
              .catch(() => {});
          }
        }
      } catch {
        // Storage o parse error silencioso
      }
    }
  }, [items, svgContent]);

  const handleConfirmCart = () => {
    setShowCheckout(true);
    // Scroll to checkout section
    setTimeout(() => {
      document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUploadSvgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera los 10 MB. Por favor subí uno más liviano.');
      return;
    }
    try {
      if (file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml') {
        const text = await file.text();
        if (text.includes('<svg')) {
          setSvgContent(text);
          setSvgPreviewImg(null);
          setSvgFileName(file.name);
          toast.success('Diseño SVG cargado correctamente');
        } else {
          toast.error('El archivo no parece ser un SVG válido');
        }
      } else if (file.type.startsWith('image/')) {
        setSvgPreviewImg(URL.createObjectURL(file));
        setSvgContent('IMAGE_SCREENSHOT');
        setSvgFileName(file.name);
        toast.success('Diseño cargado correctamente');
      } else {
        toast.error('Por favor, subí un archivo en formato .svg');
      }
    } catch (err) {
      console.error('Error al leer archivo de grabado', err);
      toast.error('No se pudo leer el archivo');
    }
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

    // Validación de comprobante si eligió Transferencia bancaria
    if (paymentMethod === 'transfer' && !comprobanteFile) {
      toast.error('Por favor, subí el comprobante de pago para continuar.');
      return;
    }

    // Validación de grabado si hay productos personalizados
    const hasCustomizationItem = items.some((item) => item.hasCustomization);
    if (hasCustomizationItem && !svgContent) {
      toast.error('Por favor, subí el diseño de tu grabado para continuar.');
      return;
    }

    try {
      let uploadedReceiptUrl: string | undefined = undefined;

      // Subir archivo real a Cloudinary si es transferencia
      if (paymentMethod === 'transfer' && comprobanteFile) {
        const toastId = toast.loading('Subiendo comprobante de pago...');
        try {
          const receiptFormData = new FormData();
          receiptFormData.append('file', comprobanteFile);

          const uploadRes = await axios.post(`${API_URL}/orders/upload-receipt`, receiptFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          uploadedReceiptUrl = uploadRes.data?.receiptUrl;
          toast.success('Comprobante subido correctamente', { id: toastId });
        } catch (uploadErr: any) {
          console.error('Error al subir comprobante:', uploadErr);
          const errMsg =
            uploadErr.response?.data?.error ||
            'Error al subir el comprobante. Por favor intentá nuevamente.';
          toast.error(errMsg, { id: toastId });
          return;
        }
      }

      // Unificamos las notas del mate, indicaciones de envío y referencias de archivos
      const indicationsList: string[] = [];
      if (mateNotes.trim()) {
        indicationsList.push(`Aclaraciones mate: ${mateNotes.trim()}`);
      }
      if (guestData.extraIndications.trim()) {
        indicationsList.push(`Envío: ${guestData.extraIndications.trim()}`);
      }
      if (hasCustomizationItem && svgFileName) {
        indicationsList.push(`Grabado: ${svgFileName}`);
      }
      if (paymentMethod === 'transfer' && comprobanteFile) {
        indicationsList.push(
          `Comprobante Transferencia: ${comprobanteFile.name} (${(comprobanteFile.size / 1024).toFixed(1)} KB)`
        );
      }
      const combinedIndications = indicationsList.join(' | ');

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
          extraIndications: combinedIndications,
          receiptUrl: uploadedReceiptUrl,
          ...(!isAuthenticated
            ? {
                guestEmail: guestData.email,
              }
            : {}),
        },
        paymentMethod,
        receiptUrl: uploadedReceiptUrl,
      };

      const resultAction = await dispatch(createOrder(orderData));

      if (createOrder.fulfilled.match(resultAction)) {
        const order = resultAction.payload;

        if (paymentMethod === 'transfer') {
          toast.success('Pedido realizado con éxito. ¡Gracias!');
          router.push(`/compra-exitosa?orderId=${order.id}`);
        } else {
          // Cash
          const phoneNumber = '5491130548207';
          const message = `Hola, realicé el pedido #${order.id} (Efectivo).${
            mateNotes ? ` Aclaración: ${mateNotes}` : ''
          }`;
          const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          toast.success('Pedido realizado. Redirigiendo a WhatsApp...');
          router.push(`/compra-exitosa?orderId=${order.id}`);
        }

        dispatch({ type: 'cart/clearCart' });
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
                    <Image
                      src={thumbUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
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

              {/* Transferencia bancaria */}
              <label className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={() => setPaymentMethod('transfer')}
                  className="mt-1 h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <div className="w-full">
                  <div>
                    <span className="font-medium text-gray-800">Transferencia bancaria</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Aboná mediante transferencia a nuestro alias y adjuntá tu comprobante.
                  </p>

                  {paymentMethod === 'transfer' && (
                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">
                        El alias para transferir es:
                      </p>
                      <div className="mb-3 flex items-center gap-2">
                        <code className="rounded border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-sm font-bold text-gray-900">
                          puros.mates2026
                        </code>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText('puros.mates2026');
                            toast.success('Alias copiado');
                          }}
                          className="rounded-md border bg-white p-1.5 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                          title="Copiar alias"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Caja para subir comprobante */}
                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Subir comprobante de pago (Obligatorio)
                        </label>
                        <p className="mb-3 text-xs text-gray-500">
                          Podés adjuntar una captura de pantalla, foto o archivo PDF (máx. 10 MB).
                        </p>

                        {!comprobanteFile ? (
                          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-5 text-center transition hover:border-[#D4AF37] hover:bg-amber-50/20">
                            <Upload className="mb-2 h-7 w-7 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              Hacé clic acá para seleccionar tu comprobante
                            </span>
                            <span className="mt-1 text-xs text-gray-400">
                              Formatos permitidos: PNG, JPG, JPEG, WEBP o PDF
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error(
                                    'El archivo supera los 10 MB. Por favor subí uno más liviano.'
                                  );
                                  return;
                                }
                                setComprobanteFile(file);
                                if (file.type.startsWith('image/')) {
                                  setComprobantePreview(URL.createObjectURL(file));
                                } else {
                                  setComprobantePreview(null);
                                }
                                toast.success('Comprobante adjuntado');
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
                            <div className="flex items-center gap-3 overflow-hidden">
                              {comprobantePreview ? (
                                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={comprobantePreview}
                                    alt="Comprobante"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600">
                                  <FileText className="h-7 w-7" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-800">
                                  {comprobanteFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(comprobanteFile.size / 1024).toFixed(1)} KB •{' '}
                                  {comprobanteFile.type.includes('pdf')
                                    ? 'Documento PDF'
                                    : 'Imagen'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                                  <CheckCircle className="h-3 w-3" /> Adjunto con éxito
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                if (comprobantePreview) {
                                  URL.revokeObjectURL(comprobantePreview);
                                }
                                setComprobanteFile(null);
                                setComprobantePreview(null);
                              }}
                              className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                              title="Quitar comprobante"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

          {/* Sección Grabado Láser (si hay mates personalizados en el carrito) */}
          {items.some((item) => item.hasCustomization) && (
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
              <div className="border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Diseño de grabado láser (Obligatorio)
                  </h3>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Tu carrito incluye mate con grabado personalizado. Subí tu archivo SVG o diseñalo
                  en nuestro personalizador.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {/* Botón destacado y grande para ir a /customize en pestaña aparte */}
                <a
                  href="/customize"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-lg border-2 border-[#D4AF37] bg-white px-4 py-3.5 text-center font-bold text-[#254642] shadow-sm transition hover:bg-[#D4AF37] hover:text-[#254642]"
                >
                  <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                  <span className="text-base">¿No lo diseñaste? Diseñalo acá</span>
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </a>

                {/* Área de subida de archivo */}
                {!svgContent ? (
                  <div>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center transition hover:border-[#D4AF37] hover:bg-amber-50/20">
                      <Upload className="mb-2 h-8 w-8 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-800">
                        Subir archivo SVG de grabado
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        Hacé clic acá para seleccionar tu archivo SVG
                      </span>
                      <input
                        type="file"
                        accept=".svg,image/svg+xml,image/*"
                        className="hidden"
                        onChange={handleUploadSvgFile}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {svgFileName || 'Diseño de grabado cargado'}
                          </p>
                          <p className="text-xs text-green-700">Diseño listo para grabado láser</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (svgPreviewImg) URL.revokeObjectURL(svgPreviewImg);
                          setSvgContent(null);
                          setSvgPreviewImg(null);
                          setSvgFileName(null);
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Cambiar diseño
                      </button>
                    </div>

                    {/* Visor interactivo del diseño sobre fondo neutral */}
                    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-stone-100 p-6">
                      <p className="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase">
                        Vista previa de la virola con tu grabado:
                      </p>
                      <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-full border-4 border-stone-300 bg-white shadow-inner [&>svg]:h-full [&>svg]:w-full">
                        {svgPreviewImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={svgPreviewImg}
                            alt="Grabado"
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtítulo: Aclaraciones sobre el mate o grabado */}
          <div className="mb-8 border-b pb-8">
            <h3 className="mb-2 border-b pb-2 text-lg font-semibold text-gray-800">Aclaraciones</h3>
            <p className="mb-3 text-sm text-gray-600">
              Cada calabaza es un fruto natural único. Dejanos acá si tenés alguna preferencia o
              algún detalle especial sobre el mate o grabado.
            </p>
            <textarea
              rows={3}
              value={mateNotes}
              onChange={(e) => setMateNotes(e.target.value)}
              placeholder="Ej: Prefiero una calabaza de tamaño mediano/chico, o algún detalle específico sobre el mate o el grabado..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#D4AF37] focus:ring-[#D4AF37] focus:outline-none"
            />
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
