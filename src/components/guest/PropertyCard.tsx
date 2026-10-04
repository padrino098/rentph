import React from 'react';
import { Property } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Star, Heart, MapPin, Scale, Check, Users } from 'lucide-react';
import { store } from '../../services/store';

interface PropertyCardProps {
  property: Property;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  isCompared?: boolean;
  onToggleCompare?: (e: React.MouseEvent) => void;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isFavorited,
  onToggleFavorite,
  isCompared = false,
  onToggleCompare,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const coverImage = property.images[0]?.imageUrl || '';
  const primarySchool = property.nearbySchools[0];

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group flex flex-col text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs hover:shadow-md"
    >
      {/* Photo Container */}
      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
        <ImageWithFallback
          src={coverImage}
          alt={property.title}
          fallbackTitle={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
        />

        {/* Favorite & Compare Action Group */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {onToggleCompare && (
            <button
              onClick={e => {
                e.stopPropagation();
                onToggleCompare(e);
              }}
              className={`p-1.5 rounded-full text-xs transition-colors backdrop-blur-xs shadow-xs cursor-pointer ${
                isCompared
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/85 text-slate-700 hover:bg-white'
              }`}
              title={isCompared ? 'Remove from comparison' : 'Compare with other dorms'}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="p-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 backdrop-blur-xs transition-colors shadow-xs cursor-pointer"
            title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorited ? 'text-amber-600 fill-amber-600' : 'text-slate-700'
              }`}
            />
          </button>
        </div>

        {/* Gender Policy and Beds Available Tag */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
          {property.genderPolicy !== 'all' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-xs text-[10px] font-semibold text-white uppercase tracking-wider">
              {property.genderPolicy.replace('_', ' ')}
            </span>
          )}
          {property.availableBedsCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/85 backdrop-blur-xs text-[10px] font-semibold text-emerald-300">
              {property.availableBedsCount} {property.availableBedsCount === 1 ? 'bed' : 'beds'} free
            </span>
          )}
        </div>
      </div>

      {/* Property Details (Zero-Pill Metadata) */}
      <div className="space-y-1 px-1">
        {/* Campus Proximity Kicker */}
        {primarySchool && (
          <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>
              {primarySchool.distanceKm} km ({primarySchool.walkingMinutes} min walk) to {primarySchool.schoolShortName}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-600 transition-colors">
            {property.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-slate-800 shrink-0 font-medium">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="tabular-nums">{property.rating ? property.rating.toFixed(1) : 'New'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 truncate">
          {property.address}, {property.city}
        </p>

        {/* Room & Amenity summary */}
        <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
          <span className="capitalize">{property.propertyType.replace('_', ' ')}</span>
          <span aria-hidden="true">·</span>
          <span>{property.houseRules.curfewTime || 'No Curfew'}</span>
          <span aria-hidden="true">·</span>
          <span>{property.amenities.includes('amenity-aircon') ? 'Aircon' : 'Fan'}</span>
        </div>

        {/* Pricing in Philippine Pesos (₱) */}
        <div className="pt-2 flex items-baseline justify-between border-t border-slate-100 mt-2">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-slate-900 text-base tabular-nums">
              ₱{property.monthlyRent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-normal">/ month</span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Dep: ₱{property.securityDeposit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
