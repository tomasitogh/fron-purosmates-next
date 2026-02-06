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
    <div className="filter-tabs-container">
      <div
        className="filter-header flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p className="filter-label font-medium mb-0">Categorías</p>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isOpen && (
        <div className="filter-tabs">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`filter-tab-button ${selectedCategories.includes(category) ? 'active' : ''}`}
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
