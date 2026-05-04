'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface ShopFiltersProps {
  categories: { id: number; description: string; active: boolean }[];
  selectedCategories: number[];
  onFilterChange: (ids: number[]) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  onApply: () => void;
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
  const [minPrice, setMinPrice] = useState(priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(priceRange[1]);
  const [isOpen, setIsOpen] = useState(true);

  const activeCategories = categories.filter(c => c.active);

  const handleCategoryToggle = (id: number) => {
    if (selectedCategories.includes(id)) {
      onFilterChange(selectedCategories.filter(c => c !== id));
    } else {
      onFilterChange([...selectedCategories, id]);
    }
  };

  const handleApplyClick = () => {
    onPriceChange([minPrice || 0, maxPrice || priceRange[1]]);
    onApply();
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Categorías */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Categorías</h3>
        <div className="flex flex-col gap-2">
          {activeCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryToggle(category.id)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all border ${selectedCategories.includes(category.id)
                  ? 'border-[#254642] bg-[#254642]/5'
                  : 'border-gray-200 hover:border-[#254642]/50'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedCategories.includes(category.id)
                    ? 'border-[#254642] bg-[#254642]'
                    : 'border-gray-300'
                  }`}
              >
                {selectedCategories.includes(category.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <span className="capitalize text-gray-700">{category.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Precio</h3>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Mínimo</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Máximo</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                placeholder={priceRange[1].toString()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ordenar (mobile) */}
      {isMobile && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ordenar por</h3>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="w-full px-4 py-4 text-base bg-white border-2 border-gray-200 rounded-xl appearance-none cursor-pointer min-h-[56px]"
              style={{ WebkitAppearance: 'none', backgroundImage: 'none' }}
            >
              <option value="relevance">Relevancia</option>
              <option value="newest">Recién agregados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={24} />
          </div>
        </div>
      )}

      {/* Aplicar Filtros */}
      <button
        onClick={handleApplyClick}
        className="w-full bg-[#254642] text-white py-3 rounded-lg font-medium hover:bg-[#254642]/90 transition"
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
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold">Filtrar y Ordenar</h2>
            <button onClick={onCloseMobile} className="p-2">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <div className="space-y-6">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isOpen && content}
    </div>
  );
}