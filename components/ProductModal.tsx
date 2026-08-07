'use client';

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/cartSlice';
import type { ProductVariant } from '@/redux/productSlice';
import toast from 'react-hot-toast';
import ProductImagePreview from './ProductImagePreview';
import { AppDispatch } from '@/redux/store';

// --- F1: tipos extendidos ---
export interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  images: {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
    // E6: dirección imagen→variant (la imagen del producto trae la FK
    // lógica a la variant). El variantDTO llega con `imageUrl` derivado
    // por el backend; acá navegamos al revés cuando lo necesitemos.
    variantId?: number | null;
  }[];
  category?: { id: number; description: string };
  stock: number;
  totalStock?: number; // H3: suma del stock de variants activas (derivado del backend)
  description?: string;
  isCustomizable?: boolean;
  customizationCost?: number;
  variants?: ProductVariant[];
}

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

// E7: las variants son independientes con `name` libre. No hay selección
// por atributos, solo por id de variant.

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // E7: en vez de un `Record<attributeName, value>`, ahora es solo el `id`
  // de la variant seleccionada. La variant es independiente con `name` libre.
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const syncedVariantIdRef = useRef<number | null>(null);

  // E7: filtrar variants con stock > 0 (las de stock 0 no se muestran).
  const availableVariants = useMemo(
    () => (product.variants ?? []).filter((v) => v.stock > 0),
    [product.variants]
  );

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const width = container.clientWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth',
      });
    }
  };

  // Pre-selección: la primera variant con stock > 0. Si no hay ninguna, null.
  /* eslint-disable react-hooks/set-state-in-effect -- reset de state al
       cambiar de producto (patrón estándar, no derivable en render con key) */
  useEffect(() => {
    setWantsCustomization(false);
    setSelectedImageIndex(0);
    syncedVariantIdRef.current = null;
    const first = (product.variants ?? []).find((v) => v.stock > 0);
    setSelectedVariantId(first?.id ?? null);
    setTimeout(() => scrollToImage(0), 0);
  }, [product.id, product.variants]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedVariant = useMemo(
    () => (product.variants ?? []).find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  // F4: sincronizar imagen al cambiar de variant.
  // Usa un ref para no re-sincronizar cuando el usuario navega manualmente.

  useLayoutEffect(() => {
    const imageUrl = selectedVariant?.imageUrl;
    if (!imageUrl || !product.images) return;
    const idx = product.images.findIndex((img) => img.url === imageUrl);
    if (idx < 0) return;
    // Si ya sincronizamos esta variant, no volver a hacerlo
    // (permite que el usuario navegue imágenes manualmente)
    if (syncedVariantIdRef.current === selectedVariant?.id) return;
    syncedVariantIdRef.current = selectedVariant?.id ?? null;
    setSelectedImageIndex(idx);
    scrollToImage(idx);
  }, [selectedVariant?.imageUrl, selectedVariant?.id, product.images]);

  const canAddToCart = !!selectedVariant && selectedVariant.stock > 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('No hay una variante disponible');
      return;
    }
    if (selectedVariant.stock <= 0) {
      toast.error('Esta variante no tiene stock disponible');
      return;
    }
    const result = await dispatch(
      addToCart({
        ...product,
        hasCustomization: wantsCustomization,
        variantId: selectedVariant.id,
        variantSku: selectedVariant.sku,
        variantName: selectedVariant.name,
        variantStock: selectedVariant.stock,
        variantImageUrl: selectedVariant.imageUrl,
      })
    );
    if (addToCart.fulfilled.match(result)) {
      toast.success(`Agregado: ${product.name}${wantsCustomization ? ' (Personalizado)' : ''}`);
      onClose();
    } else {
      toast.error('Este producto no tiene stock disponible');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-in fade-in zoom-in-95 relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Sticky/Absolute */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="p-6">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            {/* Left Column: Image Section */}
            <div className="mt-8 flex flex-col gap-4 lg:mt-0">
              <div className="group relative mx-auto w-4/5 max-w-[420px] lg:w-full lg:max-w-none">
                {/* Scrollable Container */}
                <div
                  ref={scrollContainerRef}
                  className="scrollbar-hide flex aspect-square w-full snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-xl bg-gray-200"
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const width = container.clientWidth;
                    const newIndex = Math.round(container.scrollLeft / width);
                    if (
                      newIndex !== selectedImageIndex &&
                      product.images &&
                      newIndex < product.images.length
                    ) {
                      setSelectedImageIndex(newIndex);
                    }
                  }}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {product.images && product.images.length > 0 ? (
                    product.images.map((image: any, index: number) => (
                      <div
                        key={index}
                        className="relative flex h-full w-full flex-shrink-0 snap-center items-center justify-center bg-gray-200"
                      >
                        <ProductImagePreview
                          src={image.url}
                          alt={`${product.name} ${index + 1}`}
                          transform={{
                            scale: image.scale || 1,
                            x: image.x || 0,
                            y: image.y || 0,
                          }}
                          className="h-full w-full object-contain"
                          fill
                          priority={index === 0}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center text-gray-400">
                      Sin Imagen
                    </div>
                  )}
                </div>

                {/* Navigation Arrows (Desktop/Hover) */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex =
                          selectedImageIndex === 0
                            ? product.images.length - 1
                            : selectedImageIndex - 1;
                        scrollToImage(newIndex);
                      }}
                      className="absolute top-1/2 left-2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white sm:block"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newIndex =
                          selectedImageIndex === product.images.length - 1
                            ? 0
                            : selectedImageIndex + 1;
                        scrollToImage(newIndex);
                      }}
                      className="absolute top-1/2 right-2 z-10 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-800 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-white sm:block"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="scrollbar-hide flex justify-center gap-2 overflow-x-auto pb-2 lg:justify-start">
                  {product.images.map((image: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => scrollToImage(index)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-[#254642] opacity-100 ring-2 ring-[#254642] ring-offset-1'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ProductImagePreview
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        transform={{
                          scale: image.scale || 1,
                          x: image.x || 0,
                          y: image.y || 0,
                        }}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details Section */}
            <div className="flex h-full flex-col lg:pt-4">
              <div className="mb-6">
                <h2 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h2>
                <p className="flex items-center gap-2 font-medium tracking-wide text-[#254642]">
                  <span className="h-2 w-2 rounded-full bg-[#254642]"></span>
                  {product.category?.description || 'Producto'}
                </p>
              </div>

              <div className="flex-grow">
                <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Descripción
                </h4>
                <p className="scrollbar-hide max-h-[200px] overflow-y-auto leading-relaxed text-gray-600">
                  {product.description ||
                    'Este producto no tiene una descripción detallada todavía.'}
                </p>
              </div>

              {/* E7: selector único de variant (dropdown con nombres). */}
              {availableVariants.length > 0 ? (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="mb-3 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                    Variante
                  </h4>
                  <select
                    value={selectedVariantId ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const newId = raw === '' ? null : Number(raw);
                      // Resetear ref para que useLayoutEffect sincronice la imagen
                      syncedVariantIdRef.current = null;
                      setSelectedVariantId(newId);
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#254642] focus:outline-none"
                  >
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="mb-1 text-sm text-gray-500">Precio</p>
                    <span className="text-4xl font-black text-[#254642]">
                      ${product.price?.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                {/* Customization Checkbox - Only if product is customizable */}
                {product.isCustomizable && (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="modal-customization"
                        checked={wantsCustomization}
                        onChange={(e) => setWantsCustomization(e.target.checked)}
                        className="h-5 w-5 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="modal-customization"
                          className="cursor-pointer font-medium text-gray-900 select-none"
                        >
                          Quiero personalizar este producto
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          Agrega un grabado o detalle personalizado por{' '}
                          <span className="font-bold text-blue-600">
                            +${product.customizationCost?.toLocaleString('es-AR')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span>
                    $
                    {(
                      product.price + (wantsCustomization ? product.customizationCost || 0 : 0)
                    ).toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className="mt-4 w-full rounded-lg bg-[#254642] py-3 font-semibold text-white shadow-lg transition hover:bg-[#254642]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
                >
                  {!selectedVariant
                    ? 'No hay variantes disponibles'
                    : !canAddToCart
                      ? 'Sin stock'
                      : 'Agregar al Carrito'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
