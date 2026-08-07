'use client';

import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';

interface ShopFiltersProps {
  categories: { id: number; description: string; active: boolean }[];
  selectedCategories: number[];
  onFilterChange: (ids: number[]) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  onApply: (categoryIds: number[], priceRange: [number, number]) => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
}

export default function ShopFilters({
  categories,
  selectedCategories,
  onFilterChange,
  priceRange,
  onPriceChange,
  onApply,
  isMobile,
  onCloseMobile,
  sortBy = 'relevance',
  onSortChange,
}: ShopFiltersProps) {
  const [pendingCategoryIds, setPendingCategoryIds] = useState<number[]>(selectedCategories);
  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>(priceRange);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingCategoryIds(selectedCategories);
  }, [selectedCategories]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingPriceRange(priceRange);
  }, [priceRange]);

  const activeCategories = categories.filter((c) => c.active);

  const handleCategoryToggle = (id: number) => {
    if (pendingCategoryIds.includes(id)) {
      setPendingCategoryIds(pendingCategoryIds.filter((c) => c !== id));
    } else {
      setPendingCategoryIds([...pendingCategoryIds, id]);
    }
  };

  const handleApplyClick = () => {
    onPriceChange(pendingPriceRange);
    onFilterChange(pendingCategoryIds);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
    onApply(pendingCategoryIds, pendingPriceRange);
  };

  const content = (
    <div className="space-y-6">
      {/* Categorías */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Categorías</h3>
        <div className="flex flex-col gap-2">
          {activeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                pendingCategoryIds.includes(category.id)
                  ? 'border-[#254642] bg-[#254642]/5'
                  : 'border-gray-200 hover:border-[#254642]/50'
              }`}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  pendingCategoryIds.includes(category.id)
                    ? 'border-[#254642] bg-[#254642]'
                    : 'border-gray-300'
                }`}
              >
                {pendingCategoryIds.includes(category.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <span className="text-gray-700 capitalize">{category.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Precio</h3>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Mínimo</label>
              <input
                type="number"
                value={pendingPriceRange[0]}
                onChange={(e) =>
                  setPendingPriceRange([Number(e.target.value), pendingPriceRange[1]])
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Máximo</label>
              <input
                type="number"
                value={pendingPriceRange[1]}
                onChange={(e) =>
                  setPendingPriceRange([pendingPriceRange[0], Number(e.target.value)])
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                placeholder={priceRange[1].toString()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ordenar (mobile) */}
      {isMobile && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Ordenar por</h3>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="min-h-[56px] w-full cursor-pointer appearance-none rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base"
              style={{ WebkitAppearance: 'none', backgroundImage: 'none' }}
            >
              <option value="relevance">Relevancia</option>
              <option value="newest">Recién agregados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"
              size={24}
            />
          </div>
        </div>
      )}

      {/* Aplicar Filtros */}
      <button
        onClick={handleApplyClick}
        className="w-full rounded-lg bg-[#254642] py-3 font-medium text-white transition hover:bg-[#254642]/90"
      >
        Aplicar Filtros
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />

        {/* Drawer */}
        <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm overflow-y-auto bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-bold">Filtrar y Ordenar</h2>
            <button onClick={onCloseMobile} className="p-2">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">{content}</div>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className="space-y-6">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isOpen && content}
    </div>
  );
}
