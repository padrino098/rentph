import React from 'react';
import { Category } from '../../types';
import { Waves, Mountain, Sun, Building, Wine, Compass, SlidersHorizontal } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string | undefined;
  onSelectCategory: (id: string | undefined) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  Waves,
  Mountain,
  Sun,
  Building,
  Wine,
  Compass,
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onOpenFilters,
  activeFilterCount,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 border-b border-stone-200 flex items-center justify-between gap-4">
      {/* Scrollable Categories List */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
        <button
          onClick={() => onSelectCategory(undefined)}
          className={`flex flex-col items-center gap-1.5 pb-2 text-xs font-medium transition-all whitespace-nowrap cursor-pointer border-b-2 ${
            selectedCategoryId === undefined
              ? 'text-stone-900 border-stone-900'
              : 'text-stone-500 border-transparent hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <span>All Stays</span>
        </button>

        {categories.map(cat => {
          const IconComp = ICONS_MAP[cat.iconName] || Compass;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? undefined : cat.id)}
              className={`flex flex-col items-center gap-1.5 pb-2 text-xs font-medium transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isSelected
                  ? 'text-stone-900 border-stone-900'
                  : 'text-stone-500 border-transparent hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <IconComp className="w-5 h-5" />
              </div>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Button */}
      <button
        onClick={onOpenFilters}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 transition-colors whitespace-nowrap cursor-pointer shrink-0 shadow-xs"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="w-4.5 h-4.5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
};
