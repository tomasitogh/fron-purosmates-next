'use client';

import { Image as ImageIcon } from 'lucide-react';
import type { ProductVariant } from '@/redux/productSlice';
import ProductImagePreview from '@/components/ProductImagePreview';

export interface VariantImageAssignerImage {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
    variantId?: number | null;
}

interface VariantImageAssignerProps {
    images: VariantImageAssignerImage[];
    variants: ProductVariant[];
    onChange: (images: VariantImageAssignerImage[]) => void;
}

/**
 * Editor de la asignación imagen → variante (dirección inversa al modelo
 * legacy donde la variante tenía un `imageUrl`).
 *
 * Patrón: controlado. El padre (`AdminProducts`) es dueño del state.
 *
 * Reglas:
 * - El admin ve todas las imágenes del producto en una grilla.
 * - Cada imagen tiene un `<select>` con "— Sin asignar —" + las variants.
 * - Asignar una variant a una imagen es exclusivo: si la imagen A se asigna
 *   a "Marrón" y después se la asigno a "Negro", la imagen anterior queda
 *   automáticamente "Sin asignar". Esto se hace en el handler del padre.
 * - Las imágenes sin asignar funcionan como fotos genéricas del producto
 *   (la card del shop, fotos adicionales que no son de ninguna variant).
 */
export function VariantImageAssigner({ images, variants, onChange }: VariantImageAssignerProps) {

    const updateVariantId = (imageUrl: string, variantId: number | null) => {
        onChange(
            images.map(img =>
                img.url === imageUrl ? { ...img, variantId } : img
            )
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Asignar imágenes a variantes
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Cada imagen puede asignarse a una variante. Al clickear la variante
                        en el shop, se mostrará la imagen que le asignaste.
                    </p>
                </div>
            </div>

            {images.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500 italic">
                        Subí imágenes arriba para poder asignarlas a variantes.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {images.map((img) => {
                        const assignedVariant = img.variantId
                            ? variants.find(v => v.id === img.variantId)
                            : null;
                        return (
                            <div
                                key={img.url}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                                    <ProductImagePreview
                                        src={img.url}
                                        alt=""
                                        transform={{
                                            scale: img.scale || 1,
                                            x: img.x || 0,
                                            y: img.y || 0
                                        }}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* URL (truncada) + variant label */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-gray-500 truncate" title={img.url}>
                                        {img.url.length > 50 ? img.url.slice(0, 47) + '…' : img.url}
                                    </div>
                                    <div className="text-xs text-gray-700 mt-0.5">
                                        {assignedVariant ? (
                                            <span className="inline-flex items-center gap-1 text-[#254642] font-medium">
                                                <ImageIcon className="w-3 h-3" />
                                                Asignada a: {formatVariantLabel(assignedVariant)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Sin asignar (foto genérica)</span>
                                        )}
                                    </div>
                                </div>

                                {/* Selector de variante */}
                                <select
                                    value={img.variantId ?? ''}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        updateVariantId(img.url, raw === '' ? null : Number(raw));
                                    }}
                                    className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#254642] bg-white max-w-[160px]"
                                    title="Asignar a variante"
                                >
                                    <option value="">— Sin asignar —</option>
                                    {variants.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {formatVariantLabel(v)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** Etiqueta legible: usa el name de la variant. */
function formatVariantLabel(v: ProductVariant): string {
    return v.name || v.sku || `Variant ${v.id}`;
}

export default VariantImageAssigner;
