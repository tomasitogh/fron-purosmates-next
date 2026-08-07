'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterTabsProps {
  categories: string[];
  selectedType: string[];
  onFilterChange: (categories: string[]) => void;
}

export default function FilterTabs({ categories, selectedType, onFilterChange }: FilterTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategories = Array.isArray(selectedType) ? selectedType : [];

  const handleCategoryClick = (category: string) => {
    // Si la categoría ya está seleccionada, la deseleccionamos
    if (selectedCategories.includes(category.toLowerCase())) {
      const newSelection = selectedCategories.filter((c) => c !== category.toLowerCase());
      onFilterChange(newSelection);
    } else {
      // Si no, la agregamos (asegurando que sea minúscula para consistencia)
      onFilterChange([...selectedCategories, category.toLowerCase()]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex cursor-pointer items-center justify-between transition-opacity hover:opacity-80"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="mb-0 text-xl font-semibold text-gray-700">Categorías</p>
        <div
          className="text-gray-500 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown size={20} />
        </div>
      </div>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-2 overflow-hidden duration-200">
          {categories.map((category) => (
            <button
              key={category}
              className={`w-full rounded-lg border border-gray-100 px-4 py-2 text-left capitalize shadow-sm transition-all duration-200 ${
                selectedCategories.includes(category.toLowerCase())
                  ? 'border-[#254642] bg-[#254642] font-semibold text-white'
                  : 'bg-white text-gray-700 hover:border-[#254642]/30 hover:bg-gray-50'
              }`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
