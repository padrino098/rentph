import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { SearchFilters } from '../../types';
import { store } from '../../services/store';
import { FilterSelect } from '../common/FilterSelect';

interface HeroSearchProps {
  filters: SearchFilters;
  onSearch: (updated: Partial<SearchFilters>) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  filters,
  onSearch,
}) => {
  const schools = store.getSchools();
  const [location, setLocation] = useState(filters.location || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState(filters.schoolId || '');
  const [maxDistance, setMaxDistance] = useState<number | undefined>(filters.maxDistanceKm);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(filters.maxPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      location: location.trim() ? location.trim() : undefined,
      schoolId: selectedSchoolId || undefined,
      maxDistanceKm: maxDistance,
      maxPrice: maxPrice,
    });
  };

  const handleClear = () => {
    setLocation('');
    setSelectedSchoolId('');
    setMaxDistance(undefined);
    setMaxPrice(undefined);
    onSearch({
      location: undefined,
      schoolId: undefined,
      maxDistanceKm: undefined,
      maxPrice: undefined,
    });
  };

  const hasActiveCriteria = Boolean(
    location || selectedSchoolId || maxDistance || maxPrice
  );

  return (
    <div className="relative pt-8 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-slate-900 tracking-tight text-balance leading-tight">
          Find your next student dorm & rental on Rent<span className="text-amber-600 font-sans font-bold">PH</span>
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Search bedspaces, student dormitories, rooms, apartments, and condos by walking distance to top universities and business hubs.
        </p>
      </div>

      <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs">
        <form
          onSubmit={handleSubmit}
          aria-label="Search rentals"
          className="text-left"
        >
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-2">
            <div className="min-w-0">
              <label htmlFor="rental-location" className="mb-1 block text-xs font-medium text-slate-600">
                Location
              </label>
              <div className="relative">
                <MapPin aria-hidden="true" className="pointer-events-none absolute left-2.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="rental-location"
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City or area"
                  className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:bg-white focus:outline-2 focus:outline-offset-2 focus:outline-slate-500"
                />
              </div>
            </div>

            <FilterSelect
              label="Monthly budget"
              description="Choose your maximum monthly rent."
              value={maxPrice?.toString() ?? ''}
              onChange={value => setMaxPrice(value ? Number(value) : undefined)}
              options={[
                { value: '', label: 'Any budget' },
                ...[4000, 6000, 8000, 12000, 20000].map(price => ({
                  value: price.toString(),
                  label: `Up to ₱${price.toLocaleString()}`,
                })),
              ]}
            />
            <FilterSelect
              label="Near a campus"
              description="Choose a campus to narrow your search."
              value={selectedSchoolId}
              onChange={setSelectedSchoolId}
              options={[
                { value: '', label: 'Any campus' },
                ...schools.map(school => ({
                  value: school.id,
                  label: `${school.shortName} (${school.city})`,
                })),
              ]}
            />
            <FilterSelect
              label="Max distance"
              description="Choose the maximum distance from your selected campus."
              value={maxDistance?.toString() ?? ''}
              onChange={value => setMaxDistance(value ? Number(value) : undefined)}
              options={[
                { value: '', label: 'Any distance' },
                { value: '0.5', label: 'Within 500 m' },
                { value: '1', label: 'Within 1 km' },
                { value: '2', label: 'Within 2 km' },
                { value: '5', label: 'Within 5 km' },
              ]}
            />
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            {hasActiveCriteria && (
              <button
                type="button"
                onClick={handleClear}
                className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 cursor-pointer"
              >
                Clear filters
              </button>
            )}
            <button
              type="submit"
              className="flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 cursor-pointer"
            >
              <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>Search rentals</span>
            </button>
          </div>
        </form>
      </div>

      {/* Campus Quick Filter Chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Campuses:</span>
        {schools.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSelectedSchoolId(s.id);
              onSearch({ schoolId: s.id });
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
              selectedSchoolId === s.id
                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            Near {s.shortName}
          </button>
        ))}
      </div>
    </div>
  );
};
