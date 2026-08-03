'use client';

import { useMemo, useRef } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import type { ProductVariant } from '@/redux/productSlice';

interface VariantsGridProps {
    value: ProductVariant[];
    onChange: (variants: ProductVariant[]) => void;
    excludedSkus: Set<string>;
    onExcludedSkusChange: (skus: Set<string>) => void;
}

/**
 * E7: grilla simple para variants con `name` libre y stock.
 * El admin tipea el nombre y el stock por fila. Sin cartesiano ni
 * "excluir" en el sentido del refactor anterior; el admin borra filas
 * con el tacho, lo que las marca como "huérfanas" en el próximo save
 * (el backend las borra con orphanRemoval).
 */
export function VariantsGrid({
    value,
    onChange,
    excludedSkus,
    onExcludedSkusChange,
}: VariantsGridProps) {

    const variantById = useMemo(() => {
        const m = new Map<number, ProductVariant>();
        for (const v of value) {
            if (v.id) m.set(v.id, v);
        }
        return m;
    }, [value]);

    // Counter estable entre renders (useRef). Si lo declaro como `let`,
    // se resetea en cada render y todos los variants nuevos obtienen
    // el mismo `id`, lo que rompe el keyed-render de React.
    const tempIdCounterRef = useRef(0);
    const nextTempId = () => --tempIdCounterRef.current;

    const updateVariant = (id: number | null, patch: Partial<ProductVariant>) => {
        if (id === null) {
            // nueva fila
            const newVariant: ProductVariant = {
                id: nextTempId(),
                sku: '',
                name: '',
                stock: 0,
                active: true,
                ...patch,
            };
            onChange([...value, newVariant]);
            return;
        }
        onChange(value.map(v => (v.id === id ? { ...v, ...patch } : v)));
    };

    const addVariant = () => {
        const newVariant: ProductVariant = {
            id: nextTempId(),
            sku: '',
            name: '',
            stock: 0,
            active: true,
        };
        onChange([...value, newVariant]);
    };

    const removeVariant = (id: number) => {
        onChange(value.filter(v => v.id !== id));
    };

    const exclude = (id: number) => {
        const variant = variantById.get(id);
        if (!variant) return;
        const next = new Set(excludedSkus);
        next.add(variant.sku);
        onExcludedSkusChange(next);
    };

    const include = (sku: string) => {
        const next = new Set(excludedSkus);
        next.delete(sku);
        onExcludedSkusChange(next);
    };

    const visibleVariants = value.filter(v => !excludedSkus.has(v.sku));
    const excludedCount = value.length - visibleVariants.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Variantes ({visibleVariants.length}
                        {excludedCount > 0 && (
                            <span className="text-gray-400 font-normal">
                                {' '}+ {excludedCount} excluida{excludedCount === 1 ? '' : 's'}
                            </span>
                        )})
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Una fila por variante. Tipeá el nombre y el stock. Las variants con stock 0
                        no se muestran en el shop.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addVariant}
                    className="text-sm text-[#254642] hover:text-[#1d3530] font-medium flex items-center gap-1 px-3 py-1.5 rounded-md border border-[#254642] hover:bg-[#254642]/5 transition shrink-0"
                >
                    <span className="text-lg leading-none">+</span> Agregar variante
                </button>
            </div>

            {visibleVariants.length === 0 ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500 italic">
                        Sin variantes. Hacé click en &quot;Agregar variante&quot; para crear la primera.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {visibleVariants.map((v) => (
                        <div
                            key={v.id}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_100px_36px_36px] gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            {/* Nombre */}
                            <input
                                type="text"
                                value={v.name}
                                onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                                placeholder="Ej: color marrón"
                                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                title={`Nombre de la variante ${v.sku || ''}`}
                            />

                            {/* Stock */}
                            <input
                                type="number"
                                min="0"
                                value={v.stock}
                                onChange={(e) => updateVariant(v.id, { stock: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                                className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                placeholder="0"
                                title={`Stock de ${v.name || v.sku}`}
                            />

                            {/* Excluir */}
                            <button
                                type="button"
                                onClick={() => exclude(v.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition"
                                aria-label={`Excluir ${v.name || v.sku}`}
                                title="Excluir variante"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Borrar (permanente) */}
                            <button
                                type="button"
                                onClick={() => removeVariant(v.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                                aria-label={`Borrar ${v.name || v.sku}`}
                                title="Borrar variante de la lista (el backend la borra al guardar)"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Sección de excluidas (re-incluir) */}
            {excludedCount > 0 && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none py-1">
                        Mostrar {excludedCount} excluida{excludedCount === 1 ? '' : 's'}
                    </summary>
                    <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-gray-200">
                        {value
                            .filter(v => excludedSkus.has(v.sku))
                            .map((v) => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-dashed border-gray-300"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-600 truncate">
                                            {v.name || '(sin nombre)'}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            Stock: {v.stock}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => include(v.sku)}
                                        className="text-[#254642] hover:text-[#1d3530] p-1.5 rounded hover:bg-[#254642]/5 transition shrink-0"
                                        aria-label={`Re-incluir ${v.name || v.sku}`}
                                        title="Re-incluir variante"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                    </div>
                </details>
            )}
        </div>
    );
}

export default VariantsGrid;
