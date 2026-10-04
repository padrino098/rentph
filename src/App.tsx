import React, { useState, useEffect } from 'react';
import { Property, SearchFilters, Booking, Payment, School } from './types';
import { store } from './services/store';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSearch } from './components/guest/HeroSearch';
import { CategoryBar } from './components/guest/CategoryBar';
import { FilterModal } from './components/guest/FilterModal';
import { PropertyCard } from './components/guest/PropertyCard';
import { PropertyDetailView } from './components/guest/PropertyDetailView';
import { InteractiveMapSearch } from './components/guest/InteractiveMapSearch';
import { PropertyComparisonModal } from './components/guest/PropertyComparisonModal';
import { RentalApplicationModal } from './components/guest/RentalApplicationModal';
import { ApplicationsView } from './components/guest/ApplicationsView';
import { StudentMatcherModal } from './components/student/StudentMatcherModal';
import { CheckoutModal } from './components/guest/CheckoutModal';
import { TripsView } from './components/guest/TripsView';
import { FavoritesView } from './components/guest/FavoritesView';
import { MessagesView } from './components/guest/MessagesView';
import { HostDashboard } from './components/host/HostDashboard';
import { AdminConsole } from './components/admin/AdminConsole';
import { AuthModal } from './components/auth/AuthModal';
import {
  Compass,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Columns,
  Scale,
  Sparkles,
  GraduationCap,
  X
} from 'lucide-react';

function MarketplaceApp() {
  const { currentUser } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('explore');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Search & Filters State
  const [filters, setFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // View Display Mode (Grid vs Split Map/List vs Full Map)
  const [displayMode, setDisplayMode] = useState<'grid' | 'split' | 'map'>('grid');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  // Modals & Flows
  const [isStudentMatcherOpen, setIsStudentMatcherOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [applicationProperty, setApplicationProperty] = useState<Property | null>(null);

  // Checkout Modal State
  const [checkoutData, setCheckoutData] = useState<{
    property: Property;
    checkIn: string;
    checkOut: string;
    guests: number;
  } | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Reactive store state
  const [favorites, setFavorites] = useState<string[]>(store.getFavorites());
  const [comparedIds, setComparedIds] = useState<string[]>(store.getComparedPropertyIds());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setFavorites(store.getFavorites());
      setComparedIds(store.getComparedPropertyIds());
    });
    return unsub;
  }, []);

  // Fetch properties using database-level filtering and pagination
  const pageSize = displayMode === 'split' ? 8 : 12;
  const { properties, total, totalPages } = store.getProperties(filters, currentPage, pageSize);
  const categories = store.getCategories();
  const amenities = store.getAmenities();
  const schools = store.getSchools();
  const selectedSchool = schools.find(s => s.id === filters.schoolId);

  // Active filter count calculation
  const activeFilterCount = [
    Boolean(filters.location),
    Boolean(filters.schoolId),
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.propertyType && filters.propertyType !== 'all',
    filters.genderPolicy && filters.genderPolicy !== 'all',
    filters.bedrooms && filters.bedrooms > 0,
    filters.bathrooms && filters.bathrooms > 0,
    filters.amenities && filters.amenities.length > 0,
    filters.curfewOption && filters.curfewOption !== 'any',
    filters.sortBy && filters.sortBy !== 'recommended',
  ].filter(Boolean).length;

  const handleSelectProperty = (prop: Property) => {
    setSelectedProperty(prop);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToExplore = () => {
    setSelectedProperty(null);
    setCurrentView('explore');
  };

  const handleReserve = (bookingDetails: {
    property: Property;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    setCheckoutData(bookingDetails);
  };

  const handleBookingSuccess = (booking: Booking, payment: Payment) => {
    setCheckoutData(null);
    setCurrentView('trips');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={view => {
          setSelectedProperty(null);
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        favoritesCount={favorites.length}
        compareCount={comparedIds.length}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenStudentMatcher={() => setIsStudentMatcherOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW: EXPLORE / HOME */}
        {currentView === 'explore' && (
          <div>
            {/* Hero & Search Engine */}
            <HeroSearch
              filters={filters}
              onSearch={updated => {
                setFilters(prev => ({ ...prev, ...updated }));
                setCurrentPage(1);
              }}
              onOpenStudentMatcher={() => setIsStudentMatcherOpen(true)}
            />

            {/* Category Segmented Bar */}
            <CategoryBar
              categories={categories}
              selectedCategoryId={filters.categoryId}
              onSelectCategory={catId => {
                setFilters(prev => ({ ...prev, categoryId: catId }));
                setCurrentPage(1);
              }}
              onOpenFilters={() => setIsFilterModalOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* University Proximity Notification Banner if school is selected */}
            {selectedSchool && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="text-left text-xs">
                      <span className="font-semibold text-slate-900">
                        Showing dorms & bedspaces near {selectedSchool.name} ({selectedSchool.shortName})
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Transit: {selectedSchool.nearestTransit || 'Campus walking zone'} · Sorted by closest walking proximity
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, schoolId: undefined, maxDistanceKm: undefined }));
                      setCurrentPage(1);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-amber-100/60 cursor-pointer"
                    title="Clear university filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* View Controls & Results Summary Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span>
                    Showing <span className="font-semibold text-slate-900 tabular-nums">{properties.length}</span> of{' '}
                    <span className="font-semibold text-slate-900 tabular-nums">{total}</span> student dorms & rentals
                  </span>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => {
                        setFilters({});
                        setCurrentPage(1);
                      }}
                      className="text-amber-700 hover:text-amber-900 font-medium underline underline-offset-4 ml-2 cursor-pointer"
                    >
                      Reset filters ({activeFilterCount})
                    </button>
                  )}
                </div>

                {/* Search Result Display Mode Toggle (Grid, Split, Map) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setDisplayMode('grid')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                      displayMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Grid list only"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>

                  <button
                    onClick={() => setDisplayMode('split')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                      displayMode === 'split'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Split side-by-side list and interactive map"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split List & Map</span>
                  </button>

                  <button
                    onClick={() => setDisplayMode('map')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                      displayMode === 'map'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Interactive map with price pins"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Properties Container based on displayMode */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {properties.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                  <Compass className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-slate-900">No student dorms or rentals match your criteria</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                    Try adjusting your budget, removing gender restrictions, or choosing another university or city.
                  </p>
                  <button
                    onClick={() => {
                      setFilters({});
                      setCurrentPage(1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : displayMode === 'grid' ? (
                /* Standard 4-column responsive grid */
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {properties.map(property => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorited={favorites.includes(property.id)}
                        onToggleFavorite={(e) => {
                          e.stopPropagation();
                          store.toggleFavorite(property.id);
                        }}
                        isCompared={comparedIds.includes(property.id)}
                        onToggleCompare={(e) => {
                          e.stopPropagation();
                          store.toggleCompareProperty(property.id);
                        }}
                        onClick={() => handleSelectProperty(property)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-medium text-slate-600 px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : displayMode === 'split' ? (
                /* Side-by-Side: List on left, Interactive Map on right */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {properties.map(property => (
                        <div
                          key={property.id}
                          className={`transition-all duration-200 rounded-2xl ${
                            hoveredPropertyId === property.id ? 'ring-2 ring-amber-500 scale-[1.01]' : ''
                          }`}
                        >
                          <PropertyCard
                            property={property}
                            isFavorited={favorites.includes(property.id)}
                            onToggleFavorite={(e) => {
                              e.stopPropagation();
                              store.toggleFavorite(property.id);
                            }}
                            isCompared={comparedIds.includes(property.id)}
                            onToggleCompare={(e) => {
                              e.stopPropagation();
                              store.toggleCompareProperty(property.id);
                            }}
                            onClick={() => handleSelectProperty(property)}
                            onMouseEnter={() => setHoveredPropertyId(property.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pt-4 flex items-center justify-center gap-2">
                        <button
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-xs font-medium text-slate-600 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-6 lg:sticky lg:top-24">
                    <InteractiveMapSearch
                      properties={properties}
                      selectedSchool={selectedSchool}
                      selectedProperty={selectedProperty}
                      onSelectProperty={handleSelectProperty}
                      hoveredPropertyId={hoveredPropertyId}
                      setHoveredPropertyId={setHoveredPropertyId}
                    />
                  </div>
                </div>
              ) : (
                /* Full Map View */
                <div>
                  <InteractiveMapSearch
                    properties={properties}
                    selectedSchool={selectedSchool}
                    selectedProperty={selectedProperty}
                    onSelectProperty={handleSelectProperty}
                    hoveredPropertyId={hoveredPropertyId}
                    setHoveredPropertyId={setHoveredPropertyId}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: PROPERTY DETAIL (PDP) */}
        {currentView === 'detail' && selectedProperty && (
          <PropertyDetailView
            property={selectedProperty}
            onBack={handleBackToExplore}
            onOpenApplication={prop => setApplicationProperty(prop)}
            onReserveShortTerm={handleReserve}
            onOpenMessageHost={prop => {
              setCurrentView('messages');
            }}
            isFavorited={favorites.includes(selectedProperty.id)}
            onToggleFavorite={() => store.toggleFavorite(selectedProperty.id)}
            isCompared={comparedIds.includes(selectedProperty.id)}
            onToggleCompare={() => store.toggleCompareProperty(selectedProperty.id)}
          />
        )}

        {/* VIEW: TENANCY & DORM APPLICATIONS */}
        {currentView === 'applications' && (
          <ApplicationsView
            onSelectProperty={handleSelectProperty}
            onNavigateHome={() => setCurrentView('explore')}
          />
        )}

        {/* VIEW: GUEST TRIPS & RESERVATIONS */}
        {currentView === 'trips' && (
          <TripsView
            onSelectProperty={handleSelectProperty}
            onNavigateHome={() => setCurrentView('explore')}
          />
        )}

        {/* VIEW: SAVED WISHLIST */}
        {currentView === 'favorites' && (
          <FavoritesView
            onSelectProperty={handleSelectProperty}
            onNavigateHome={() => setCurrentView('explore')}
          />
        )}

        {/* VIEW: DIRECT MESSAGING */}
        {currentView === 'messages' && (
          <MessagesView initialPropertyId={selectedProperty?.id} />
        )}

        {/* VIEW: HOST PORTAL */}
        {currentView === 'host-dashboard' && (
          <HostDashboard
            onSelectProperty={handleSelectProperty}
            onOpenMessages={() => setCurrentView('messages')}
          />
        )}

        {/* VIEW: ADMIN CONSOLE */}
        {currentView === 'admin-console' && (
          <AdminConsole
            onSelectProperty={handleSelectProperty}
          />
        )}
      </main>

      {/* Floating Comparison Drawer Indicator */}
      {comparedIds.length > 0 && currentView !== 'detail' && (
        <aside
          aria-label="Housing Comparison Drawer"
          className="fixed bottom-5 right-5 z-40 bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 border border-slate-800 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium">
              Comparing <strong className="text-amber-400">{comparedIds.length}</strong> of 3 dorms
            </span>
          </div>
          <button
            onClick={() => setIsComparisonOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            View Comparison
          </button>
          <button
            onClick={() => store.clearComparison()}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            title="Clear comparison"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Modern Refined Footer */}
      <Footer onNavigate={view => setCurrentView(view)} />

      {/* Comprehensive Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        amenities={amenities}
        onApply={updatedFilters => {
          setFilters(updatedFilters);
          setCurrentPage(1);
        }}
        onReset={() => {
          setFilters({});
          setCurrentPage(1);
        }}
      />

      {/* Student Guided Housing Matcher Modal */}
      <StudentMatcherModal
        isOpen={isStudentMatcherOpen}
        onClose={() => setIsStudentMatcherOpen(false)}
        onMatchComplete={criteria => {
          setFilters(prev => ({
            ...prev,
            schoolId: criteria.schoolId,
            maxPrice: criteria.maxPrice,
            genderPolicy: criteria.genderPolicy,
            maxDistanceKm: criteria.maxDistanceKm,
            amenities: criteria.amenities,
          }));
          setCurrentPage(1);
        }}
      />

      {/* Side-by-Side Property Comparison Modal */}
      <PropertyComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onSelectProperty={handleSelectProperty}
        onApplyProperty={prop => {
          setIsComparisonOpen(false);
          setApplicationProperty(prop);
        }}
      />

      {/* Rental Application & Move-in Modal */}
      {applicationProperty && (
        <RentalApplicationModal
          isOpen={Boolean(applicationProperty)}
          onClose={() => setApplicationProperty(null)}
          property={applicationProperty}
          onSuccess={app => {
            setApplicationProperty(null);
            setCurrentView('applications');
          }}
        />
      )}

      {/* Booking Checkout Modal (for Short-term stays) */}
      {checkoutData && (
        <CheckoutModal
          isOpen={Boolean(checkoutData)}
          onClose={() => setCheckoutData(null)}
          property={checkoutData.property}
          checkIn={checkoutData.checkIn}
          checkOut={checkoutData.checkOut}
          guests={checkoutData.guests}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceApp />
    </AuthProvider>
  );
}
