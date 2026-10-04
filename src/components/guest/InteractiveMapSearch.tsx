import React, { useState } from 'react';
import { Property, School } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import {
  MapPin, GraduationCap, Star, ArrowRight,
  ZoomIn, ZoomOut, Compass, Navigation
} from 'lucide-react';

interface InteractiveMapSearchProps {
  properties: Property[];
  selectedSchool?: School;
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  hoveredPropertyId: string | null;
  setHoveredPropertyId: (id: string | null) => void;
}

export const InteractiveMapSearch: React.FC<InteractiveMapSearchProps> = ({
  properties,
  selectedSchool,
  selectedProperty,
  onSelectProperty,
  hoveredPropertyId,
  setHoveredPropertyId,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePinProperty, setActivePinProperty] = useState<Property | null>(null);

  // Compute map bounding box based on coordinates
  // Manila area baseline: Lat ~14.55 to 14.66, Lng ~120.97 to 121.08
  const baseLat = selectedSchool?.latitude || 14.6091; // UST default
  const baseLng = selectedSchool?.longitude || 120.9899;

  // Convert lat/lng into percentage relative to map canvas
  const getMapCoordinates = (lat: number, lng: number) => {
    // Offset range approx 0.15 deg lat, 0.15 deg lng
    const latSpan = 0.14 / zoomLevel;
    const lngSpan = 0.16 / zoomLevel;

    const yPct = 50 - ((lat - baseLat) / latSpan) * 100;
    const xPct = 50 + ((lng - baseLng) / lngSpan) * 100;

    return {
      x: Math.max(5, Math.min(95, xPct)),
      y: Math.max(5, Math.min(95, yPct)),
    };
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner select-none">
      {/* Map Graphic Background Simulation */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* River / Pasig River curve representation */}
        <path
          d="M 0 380 Q 250 340 450 420 T 900 480"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="18"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Major Thoroughfares: España Blvd / EDSA */}
        <path d="M 100 0 L 700 620" fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <path d="M 0 280 L 900 300" fill="none" stroke="#e2e8f0" strokeWidth="7" />
      </svg>

      {/* Campus Landmark Marker & Walking Radius Ring */}
      {selectedSchool && (() => {
        const coords = getMapCoordinates(selectedSchool.latitude, selectedSchool.longitude);
        return (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            {/* 1km Walking Radius Ring */}
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-amber-600/35 bg-amber-500/10 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2">
              <span className="text-[9px] font-semibold text-amber-800 bg-white/90 px-1.5 py-0.5 rounded shadow-xs mb-36">
                1.0 km student walk zone
              </span>
            </div>

            {/* School Icon Pin */}
            <div className="relative z-20 flex flex-col items-center pointer-events-auto">
              <div className="px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold text-[11px] shadow-lg flex items-center gap-1 border-2 border-amber-400">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedSchool.shortName} Campus</span>
              </div>
              <div className="w-1.5 h-3 bg-slate-900 mx-auto" />
            </div>
          </div>
        );
      })()}

      {/* Property Price Pill Pins */}
      {properties.map(p => {
        const coords = getMapCoordinates(p.latitude, p.longitude);
        const isHovered = hoveredPropertyId === p.id;
        const isSelected = selectedProperty?.id === p.id || activePinProperty?.id === p.id;

        return (
          <div
            key={p.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 z-20 cursor-pointer ${
              isHovered || isSelected ? 'scale-110 z-30' : 'hover:scale-105'
            }`}
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            onClick={() => {
              setActivePinProperty(p);
              onSelectProperty(p);
            }}
            onMouseEnter={() => setHoveredPropertyId(p.id)}
            onMouseLeave={() => setHoveredPropertyId(null)}
          >
            <div
              className={`px-2.5 py-1 rounded-full font-semibold text-xs tabular-nums shadow-md transition-all flex items-center gap-1 border ${
                isSelected
                  ? 'bg-amber-600 text-white border-white ring-2 ring-amber-600'
                  : isHovered
                  ? 'bg-slate-950 text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-500'
              }`}
            >
              <span>₱{(p.monthlyRent / 1000).toFixed(1)}k</span>
              {p.availableBedsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </div>
          </div>
        );
      })}

      {/* Floating Mini Card for Active Pin */}
      {activePinProperty && (
        <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <ImageWithFallback
                src={activePinProperty.images[0]?.imageUrl}
                alt={activePinProperty.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="capitalize font-medium text-slate-700">{activePinProperty.propertyType.replace('_', ' ')}</span>
                <span className="font-semibold text-slate-900 tabular-nums">₱{activePinProperty.monthlyRent.toLocaleString()}/mo</span>
              </div>
              <h4 className="font-semibold text-xs text-slate-900 truncate mt-0.5">
                {activePinProperty.title}
              </h4>
              {activePinProperty.nearbySchools[0] && (
                <div className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                  📍 {activePinProperty.nearbySchools[0].distanceKm} km ({activePinProperty.nearbySchools[0].walkingMinutes}m walk) to {activePinProperty.nearbySchools[0].schoolShortName}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {activePinProperty.availableBedsCount} beds free
                </span>
                <button
                  onClick={() => onSelectProperty(activePinProperty)}
                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-30">
        <button
          onClick={() => setZoomLevel(z => Math.min(2.2, z + 0.3))}
          className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-xs border border-slate-200 cursor-pointer transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.3))}
          className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-xs border border-slate-200 cursor-pointer transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-xs border border-slate-200 cursor-pointer transition-colors"
          title="Reset View"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs rounded-xl p-2 px-3 border border-slate-200 text-[10px] text-slate-600 shadow-xs flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Available Beds</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>University Campus</span>
        </div>
      </div>
    </div>
  );
};
