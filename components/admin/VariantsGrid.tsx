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
    onChange(value.map((v) => (v.id === id ? { ...v, ...patch } : v)));
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
    onChange(value.filter((v) => v.id !== id));
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

  const visibleVariants = value.filter((v) => !excludedSkus.has(v.sku));
  const excludedCount = value.length - visibleVariants.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Variantes ({visibleVariants.length}
            {excludedCount > 0 && (
              <span className="font-normal text-gray-400">
                {' '}
                + {excludedCount} excluida{excludedCount === 1 ? '' : 's'}
              </span>
            )}
            )
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            Una fila por variante. Tipeá el nombre y el stock. Las variants con stock 0 no se
            muestran en el shop.
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="flex shrink-0 items-center gap-1 rounded-md border border-[#254642] px-3 py-1.5 text-sm font-medium text-[#254642] transition hover:bg-[#254642]/5 hover:text-[#1d3530]"
        >
          <span className="text-lg leading-none">+</span> Agregar variante
        </button>
      </div>

      {visibleVariants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <p className="text-xs text-gray-500 italic">
            Sin variantes. Hacé click en &quot;Agregar variante&quot; para crear la primera.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleVariants.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-[1fr_100px_36px_36px]"
            >
              {/* Nombre */}
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                placeholder="Ej: color marrón"
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#254642] focus:outline-none"
                title={`Nombre de la variante ${v.sku || ''}`}
              />

              {/* Stock */}
              <input
                type="number"
                min="0"
                value={v.stock}
                onChange={(e) =>
                  updateVariant(v.id, { stock: Math.max(0, parseInt(e.target.value || '0', 10)) })
                }
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#254642] focus:outline-none"
                placeholder="0"
                title={`Stock de ${v.name || v.sku}`}
              />

              {/* Excluir */}
              <button
                type="button"
                onClick={() => exclude(v.id)}
                className="rounded p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                aria-label={`Excluir ${v.name || v.sku}`}
                title="Excluir variante"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Borrar (permanente) */}
              <button
                type="button"
                onClick={() => removeVariant(v.id)}
                className="rounded p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
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
          <summary className="cursor-pointer py-1 text-gray-500 select-none hover:text-gray-700">
            Mostrar {excludedCount} excluida{excludedCount === 1 ? '' : 's'}
          </summary>
          <div className="mt-2 space-y-1.5 border-l-2 border-gray-200 pl-2">
            {value
              .filter((v) => excludedSkus.has(v.sku))
              .map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded border border-dashed border-gray-300 bg-white p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-gray-600">{v.name || '(sin nombre)'}</div>
                    <div className="truncate text-xs text-gray-400">Stock: {v.stock}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => include(v.sku)}
                    className="shrink-0 rounded p-1.5 text-[#254642] transition hover:bg-[#254642]/5 hover:text-[#1d3530]"
                    aria-label={`Re-incluir ${v.name || v.sku}`}
                    title="Re-incluir variante"
                  >
                    <RotateCcw className="h-4 w-4" />
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
