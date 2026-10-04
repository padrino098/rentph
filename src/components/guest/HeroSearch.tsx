import React, { useState } from 'react';
import { Search, MapPin, GraduationCap, Users, X, Sparkles, Navigation } from 'lucide-react';
import { SearchFilters, School } from '../../types';
import { store } from '../../services/store';

interface HeroSearchProps {
  filters: SearchFilters;
  onSearch: (updated: Partial<SearchFilters>) => void;
  onOpenStudentMatcher: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  filters,
  onSearch,
  onOpenStudentMatcher,
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
      {/* Student Guided Matcher Callout Banner */}
      <div className="max-w-2xl mx-auto mb-5">
        <button
          onClick={onOpenStudentMatcher}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Looking for college housing? Try the <strong>Student Housing Matcher</strong></span>
          <span className="text-amber-700 font-bold ml-1">→</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-slate-900 tracking-tight text-balance leading-tight">
          Find your next student dorm & rental on Rent<span className="text-amber-600 font-sans font-bold">PH</span>
        </h1>
        <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          Search bedspaces, student dormitories, rooms, apartments, and condos by walking distance to top universities and business hubs.
        </p>
      </div>

      {/* Main Search Bar Module */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-full shadow-md border border-slate-200/90 p-2 sm:p-2.5">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-left"
        >
          {/* Target Campus / University */}
          <div className="px-4 py-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Campus / School
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSchoolId}
                onChange={e => setSelectedSchoolId(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 focus:outline-none bg-transparent"
              >
                <option value="">All Campuses / Cities</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    Near {s.shortName} ({s.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Area / Barangay */}
          <div className="px-4 py-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Location / Area
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. España, Katipunan, BGC"
                className="w-full text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Max Distance */}
          <div className="px-4 py-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Max Distance
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={maxDistance || ''}
                onChange={e => setMaxDistance(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs font-medium text-slate-900 focus:outline-none bg-transparent"
              >
                <option value="">Any distance</option>
                <option value="0.5">Within 500m (5m walk)</option>
                <option value="1.0">Within 1 km (12m walk)</option>
                <option value="2.0">Within 2 km</option>
                <option value="5.0">Within 5 km</option>
              </select>
            </div>
          </div>

          {/* Max Budget & Submit Button */}
          <div className="px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Max Monthly Rent
              </label>
              <select
                value={maxPrice || ''}
                onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs font-medium text-slate-900 focus:outline-none bg-transparent mt-0.5"
              >
                <option value="">Any Budget</option>
                <option value="4000">Up to ₱4,000</option>
                <option value="6000">Up to ₱6,000</option>
                <option value="8000">Up to ₱8,000</option>
                <option value="12000">Up to ₱12,000</option>
                <option value="20000">Up to ₱20,000</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              {hasActiveCriteria && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                  title="Clear search filters"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shrink-0 cursor-pointer shadow-xs"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
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
