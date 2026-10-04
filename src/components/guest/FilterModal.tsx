import React, { useState } from 'react';
import { SearchFilters, Amenity } from '../../types';
import { X, Check } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  amenities: Amenity[];
  onApply: (filters: SearchFilters) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  amenities,
  onApply,
  onReset,
}) => {
  const [minPrice, setMinPrice] = useState<number | undefined>(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(filters.maxPrice);
  const [propertyType, setPropertyType] = useState<string>(filters.propertyType || 'all');
  const [bedrooms, setBedrooms] = useState<number | undefined>(filters.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | undefined>(filters.bathrooms);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(filters.amenities || []);
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>(filters.sortBy || 'recommended');

  if (!isOpen) return null;

  const handleToggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    onApply({
      ...filters,
      minPrice: minPrice !== undefined && minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice !== undefined && maxPrice > 0 ? maxPrice : undefined,
      propertyType: propertyType === 'all' ? undefined : propertyType,
      bedrooms: bedrooms && bedrooms > 0 ? bedrooms : undefined,
      bathrooms: bathrooms && bathrooms > 0 ? bathrooms : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      sortBy,
    });
    onClose();
  };

  const handleResetInternal = () => {
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setPropertyType('all');
    setBedrooms(undefined);
    setBathrooms(undefined);
    setSelectedAmenities([]);
    setSortBy('recommended');
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 text-base">Filter Stays</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-left">
          {/* Sort Order */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Sort By
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Recommended', value: 'recommended' },
                { label: 'Price: Low to High', value: 'price_asc' },
                { label: 'Price: High to Low', value: 'price_desc' },
                { label: 'Highest Rated', value: 'rating' },
                { label: 'Newest Additions', value: 'newest' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value as SearchFilters['sortBy'])}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                    sortBy === opt.value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Price Range Per Night ($ USD)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-stone-500">Minimum</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-stone-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={minPrice ?? ''}
                    onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <span className="text-[11px] text-stone-500">Maximum</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2 text-stone-400 text-xs">$</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    placeholder="2000+"
                    value={maxPrice ?? ''}
                    onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Property Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Property Architecture
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'villa', 'chalet', 'sanctuary', 'loft', 'cabin'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPropertyType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors ${
                    propertyType === type
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  {type === 'all' ? 'Any Type' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Rooms and Beds */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Rooms & Bathrooms
            </label>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-stone-700 block mb-1.5 font-medium">Bedrooms</span>
                <div className="flex gap-2">
                  {[undefined, 1, 2, 3, 4].map(num => (
                    <button
                      key={num ?? 'any'}
                      type="button"
                      onClick={() => setBedrooms(num)}
                      className={`w-12 py-1.5 text-xs rounded-lg border text-center font-medium transition-colors ${
                        bedrooms === num
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {num === undefined ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs text-stone-700 block mb-1.5 font-medium">Bathrooms</span>
                <div className="flex gap-2">
                  {[undefined, 1, 2, 3].map(num => (
                    <button
                      key={num ?? 'any'}
                      type="button"
                      onClick={() => setBathrooms(num)}
                      className={`w-12 py-1.5 text-xs rounded-lg border text-center font-medium transition-colors ${
                        bathrooms === num
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {num === undefined ? 'Any' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-100" />

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {amenities.map(a => {
                const checked = selectedAmenities.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleToggleAmenity(a.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      checked
                        ? 'border-stone-900 bg-stone-50 text-stone-900'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        checked ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs truncate">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50 rounded-b-2xl">
          <button
            type="button"
            onClick={handleResetInternal}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};
