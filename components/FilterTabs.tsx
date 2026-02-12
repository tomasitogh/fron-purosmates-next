'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = ['mates', 'bombillas', 'accesorios'];

interface FilterTabsProps {
  selectedType: string[];
  onFilterChange: (categories: string[]) => void;
}

export default function FilterTabs({ selectedType, onFilterChange }: FilterTabsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategories = Array.isArray(selectedType) ? selectedType : [];

  const handleCategoryClick = (category: string) => {
    if (selectedCategories.includes(category)) {
      const newSelection = selectedCategories.filter(c => c !== category);
      onFilterChange(newSelection);
    } else {
      onFilterChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="text-xl font-semibold text-gray-700 mb-0">Categorías</p>
        <div className="text-gray-500 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={20} />
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 border border-gray-100 shadow-sm capitalize ${selectedCategories.includes(category)
                  ? 'bg-[#2d5d52] text-white border-[#2d5d52] font-semibold'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-[#2d5d52]/30'
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
