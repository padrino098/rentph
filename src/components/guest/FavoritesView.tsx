import React from 'react';
import { Property } from '../../types';
import { store } from '../../services/store';
import { PropertyCard } from './PropertyCard';
import { Heart } from 'lucide-react';

interface FavoritesViewProps {
  onSelectProperty: (property: Property) => void;
  onNavigateHome: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onSelectProperty, onNavigateHome }) => {
  const favoriteIds = store.getFavorites();
  const allProperties = store.getProperties({}, 1, 100).properties;
  const favoritedProperties = allProperties.filter(p => favoriteIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
          Your Saved Sanctuaries
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          {favoritedProperties.length} {favoritedProperties.length === 1 ? 'retreat' : 'retreats'} bookmarked for future travels.
        </p>
      </div>

      {favoritedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
          <Heart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900">No saved stays yet</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4 max-w-sm mx-auto">
            Click the heart icon on any sanctuary to curate your personal architectural wishlist.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Explore Sanctuaries
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoritedProperties.map(prop => (
            <PropertyCard
              key={prop.id}
              property={prop}
              isFavorited={true}
              onToggleFavorite={() => store.toggleFavorite(prop.id)}
              onClick={() => onSelectProperty(prop)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
