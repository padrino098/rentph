import React, { useState } from 'react';
import { School, GenderPolicy, PropertyType } from '../../types';
import { store } from '../../services/store';
import {
  GraduationCap, MapPin, DollarSign, Users,
  Sparkles, X, ArrowRight, Check, Shield
} from 'lucide-react';

interface StudentMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchComplete: (criteria: {
    schoolId: string;
    maxPrice?: number;
    genderPolicy?: GenderPolicy;
    maxDistanceKm?: number;
    amenities?: string[];
  }) => void;
}

export const StudentMatcherModal: React.FC<StudentMatcherModalProps> = ({
  isOpen,
  onClose,
  onMatchComplete,
}) => {
  const schools = store.getSchools();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || 'school-ust');
  const [budget, setBudget] = useState<number>(7000);
  const [genderPolicy, setGenderPolicy] = useState<GenderPolicy>('all');
  const [maxDistance, setMaxDistance] = useState<number>(1.5);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'amenity-wifi',
    'amenity-study',
  ]);

  if (!isOpen) return null;

  const currentSchool = schools.find(s => s.id === selectedSchoolId);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleApplyMatch = () => {
    onMatchComplete({
      schoolId: selectedSchoolId,
      maxPrice: budget,
      genderPolicy: genderPolicy === 'all' ? undefined : genderPolicy,
      maxDistanceKm: maxDistance,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-slate-900 leading-tight">
                Student Housing Matcher
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tell us your campus, budget, and walking limit for tailored dorms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Question 1: University */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              1. What school or university do you attend?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {schools.map(s => {
                const isSelected = s.id === selectedSchoolId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSchoolId(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs truncate">{s.shortName}</div>
                    <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {s.city}
                    </div>
                  </button>
                );
              })}
            </div>
            {currentSchool && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentSchool.address} ({currentSchool.nearestTransit})</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* Question 2: Monthly Budget */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Maximum Monthly Budget
              </label>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                ₱{budget.toLocaleString()} / month
              </span>
            </div>
            <input
              type="range"
              min="3000"
              max="20000"
              step="500"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>₱3,000 (Bedspace)</span>
              <span>₱7,000 (Shared Quad)</span>
              <span>₱15,000+ (Solo Studio)</span>
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Question 3: Max Distance */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                3. Maximum Distance from Campus
              </label>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                Within {maxDistance} km (≈ {Math.round((maxDistance / 4.8) * 60)} min walk)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.5, 1.0, 2.0, 3.0].map(dist => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setMaxDistance(dist)}
                  className={`py-2 px-3 text-xs rounded-xl border text-center font-medium cursor-pointer transition-colors ${
                    maxDistance === dist
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {dist < 1 ? '< 500m' : `< ${dist} km`}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Question 4: Gender Policy */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              4. Dorm Gender Policy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Any / Co-ed' },
                { id: 'female_only', label: 'Female Only' },
                { id: 'male_only', label: 'Male Only' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGenderPolicy(opt.id as GenderPolicy)}
                  className={`py-2 px-3 text-xs rounded-xl border text-center font-medium cursor-pointer transition-colors ${
                    genderPolicy === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Question 5: Key Amenities */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              5. Must-Have Study & Safety Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'amenity-wifi', label: 'High-Speed Fiber WiFi' },
                { id: 'amenity-study', label: 'Silent Study Lounge' },
                { id: 'amenity-aircon', label: 'Air Conditioning' },
                { id: 'amenity-generator', label: 'Backup Generator' },
                { id: 'amenity-security', label: '24/7 Security & CCTV' },
                { id: 'amenity-laundry', label: 'In-House Laundry' },
              ].map(am => {
                const checked = selectedAmenities.includes(am.id);
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-colors ${
                      checked
                        ? 'border-slate-900 bg-slate-50 font-medium text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{am.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyMatch}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Show Matching Housing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
