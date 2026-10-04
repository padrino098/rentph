import React from 'react';
import { Property } from '../../types';
import { store } from '../../services/store';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, Check, Minus, ArrowRight, MapPin, Trash2 } from 'lucide-react';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  onApplyProperty: (property: Property) => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  onApplyProperty,
}) => {
  const properties = store.getComparedProperties();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg text-slate-900">
              Side-by-Side Housing Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Comparing {properties.length} of max 3 dormitories and rental options.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <button
                onClick={() => store.clearComparison()}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {properties.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No properties selected for comparison. Click "Compare" on any property card to view side-by-side.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 w-40 font-semibold text-slate-400 uppercase tracking-wider text-[10px] bg-slate-50 border border-slate-200">
                      Criteria
                    </th>
                    {properties.map(p => (
                      <th
                        key={p.id}
                        className="p-3 min-w-56 bg-slate-50 border border-slate-200 align-top"
                      >
                        <div className="relative mb-2 aspect-16/10 rounded-lg overflow-hidden bg-slate-200">
                          <ImageWithFallback
                            src={p.images[0]?.imageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => store.toggleCompareProperty(p.id)}
                            className="absolute top-1.5 right-1.5 p-1 bg-white/90 text-slate-600 hover:text-red-600 rounded-full shadow-xs cursor-pointer"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                          {p.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate">
                          {p.city}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {/* Monthly Rent */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Monthly Rent
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 font-semibold text-sm text-slate-900 tabular-nums">
                        ₱{p.monthlyRent.toLocaleString()} / mo
                      </td>
                    ))}
                  </tr>

                  {/* Campus Proximity */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Nearest Campus
                    </td>
                    {properties.map(p => {
                      const nearest = p.nearbySchools[0];
                      return (
                        <td key={p.id} className="p-3 border border-slate-200">
                          {nearest ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {nearest.schoolShortName} ({nearest.distanceKm} km)
                              </div>
                              <div className="text-[11px] text-emerald-700 font-medium">
                                ≈ {nearest.walkingMinutes} min walk
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Urban rental</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Available Beds */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Available Beds
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 font-medium text-slate-900">
                        {p.availableBedsCount} of {p.totalBedsCount} beds free
                      </td>
                    ))}
                  </tr>

                  {/* Gender Policy */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Gender Policy
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 capitalize font-medium text-slate-800">
                        {p.genderPolicy.replace('_', ' ')}
                      </td>
                    ))}
                  </tr>

                  {/* Curfew */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Curfew
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 text-slate-700">
                        {p.houseRules.curfewTime || 'No Curfew'}
                      </td>
                    ))}
                  </tr>

                  {/* Air Conditioning */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Air Conditioning
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200">
                        {p.amenities.includes('amenity-aircon') ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Study Area */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Study Lounge
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200">
                        {p.amenities.includes('amenity-study') ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Backup Generator */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Backup Generator
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200">
                        {p.amenities.includes('amenity-generator') ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300" />
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Security Deposit */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border border-slate-200">
                      Security Deposit
                    </td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 tabular-nums">
                        ₱{p.securityDeposit.toLocaleString()} (1 mo)
                      </td>
                    ))}
                  </tr>

                  {/* Action CTA Row */}
                  <tr>
                    <td className="p-3 bg-slate-50 border border-slate-200"></td>
                    {properties.map(p => (
                      <td key={p.id} className="p-3 border border-slate-200 space-y-2">
                        <button
                          onClick={() => {
                            onClose();
                            onApplyProperty(p);
                          }}
                          className="w-full py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                        >
                          Apply / Reserve
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectProperty(p);
                          }}
                          className="w-full py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-[11px]"
                        >
                          View Details
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
