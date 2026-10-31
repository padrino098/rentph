import React from 'react';
import { Property } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Star, Heart, Scale } from 'lucide-react';

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

  return (
    <article
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group relative flex flex-col text-left transition-all duration-200 hover:-translate-y-1 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs hover:shadow-md"
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`View details for ${property.title}`}
        className="w-full h-full p-2 sm:p-3 text-left rounded-xl sm:rounded-2xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        <div className="relative aspect-4/3 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 mb-2 sm:mb-3 border border-slate-100">
          <ImageWithFallback
            src={coverImage}
            alt={property.title}
            fallbackTitle={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
        </div>

        <div className="space-y-1 px-0.5 sm:px-1 min-w-0">
          <h3 className="min-h-8 sm:min-h-10 font-semibold text-slate-900 text-xs sm:text-sm leading-4 sm:leading-5 line-clamp-2 wrap-break-word group-hover:text-slate-600 transition-colors">
            {property.title}
          </h3>

          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              {property.city}
            </p>
            <span
              className="flex items-center gap-0.5 text-[11px] sm:text-xs text-slate-800 shrink-0 font-medium"
              aria-label={property.rating ? `Rated ${property.rating.toFixed(1)} out of 5` : 'New listing'}
            >
              <Star aria-hidden="true" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
              <span className="tabular-nums">{property.rating ? property.rating.toFixed(1) : 'New'}</span>
            </span>
          </div>

          <div className="pt-1 flex flex-wrap items-baseline gap-x-1">
            <span className="font-semibold text-slate-900 text-sm sm:text-base tabular-nums whitespace-nowrap">
              ₱{property.monthlyRent.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-normal whitespace-nowrap">/ month</span>
          </div>
        </div>
      </button>

      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1">
        {onToggleCompare && (
          <button
            type="button"
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
            aria-label={isCompared ? `Remove ${property.title} from comparison` : `Compare ${property.title}`}
            aria-pressed={isCompared}
          >
            <Scale aria-hidden="true" className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite(e);
          }}
          className="p-1.5 rounded-full bg-white/85 hover:bg-white text-slate-700 backdrop-blur-xs transition-colors shadow-xs cursor-pointer"
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isFavorited ? `Remove ${property.title} from wishlist` : `Save ${property.title} to wishlist`}
          aria-pressed={isFavorited}
        >
          <Heart
            aria-hidden="true"
            className={`w-3.5 h-3.5 transition-colors ${
              isFavorited ? 'text-amber-600 fill-amber-600' : 'text-slate-700'
            }`}
          />
        </button>
      </div>
    </article>
  );
};
