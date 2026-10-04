import React, { useState, useMemo } from 'react';
import { Property, Review, Amenity, DormRoom, DormBed } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { store } from '../../services/store';
import {
  Star, Heart, Share2, ArrowLeft, ShieldCheck,
  Calendar, Users, Check, AlertCircle, MessageSquare,
  Sparkles, Wifi, Wind, Shield, Zap, BookOpen, Utensils,
  Gauge, Clock, Fingerprint, Waves, Car, GraduationCap,
  MapPin, Scale, ChevronRight
} from 'lucide-react';

interface PropertyDetailViewProps {
  property: Property;
  onBack: () => void;
  onOpenApplication: (property: Property) => void;
  onReserveShortTerm: (bookingDetails: {
    property: Property;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
  onOpenMessageHost: (property: Property) => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isCompared: boolean;
  onToggleCompare: () => void;
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  Wifi,
  BookOpen,
  Wind,
  Shield,
  Zap,
  Sparkles,
  Utensils,
  Gauge,
  Clock,
  Fingerprint,
  Waves,
  Car,
};

export const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({
  property,
  onBack,
  onOpenApplication,
  onReserveShortTerm,
  onOpenMessageHost,
  isFavorited,
  onToggleFavorite,
  isCompared,
  onToggleCompare,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Transient booking dates state
  const [checkIn, setCheckIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 33);
    return d.toISOString().split('T')[0];
  });

  const reviews = store.getReviewsForProperty(property.id);
  const allAmenities = store.getAmenities();

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Listing link copied to clipboard.');
    }
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ id: '1', propertyId: property.id, imageUrl: '', sortOrder: 0, isCover: true }];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left">
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Housing Search</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCompare}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              isCompared
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? 'In Comparison' : 'Compare'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={onToggleFavorite}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'text-amber-600 fill-amber-600' : ''}`} />
            <span>{isFavorited ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Property Title & Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-semibold uppercase tracking-wider">
            {property.propertyType.replace('_', ' ')}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-semibold capitalize">
            {property.genderPolicy.replace('_', ' ')}
          </span>
          {property.availableBedsCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
              {property.availableBedsCount} of {property.totalBedsCount} beds available
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-slate-900 tracking-tight">
          {property.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1 font-semibold text-slate-900">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="tabular-nums">{property.rating?.toFixed(1) || '5.0'}</span>
          </div>
          <span>·</span>
          <span>{reviews.length} reviews</span>
          <span>·</span>
          <span>{property.address}, {property.barangay ? `${property.barangay}, ` : ''}{property.city}</span>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 rounded-2xl overflow-hidden mb-10 max-h-[440px]">
        <div
          onClick={() => setSelectedPhotoIndex(0)}
          className="md:col-span-2 relative aspect-4/3 md:aspect-auto md:h-[440px] bg-slate-100 cursor-pointer overflow-hidden group"
        >
          <ImageWithFallback
            src={images[0]?.imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        </div>

        <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2.5 h-[440px]">
          {images.slice(1, 5).map((img, idx) => (
            <div
              key={img.id || idx}
              onClick={() => setSelectedPhotoIndex(idx + 1)}
              className="relative bg-slate-100 cursor-pointer overflow-hidden group h-[215px]"
            >
              <ImageWithFallback
                src={img.imageUrl}
                alt={`${property.title} view ${idx + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column (7 cols): Property Specs & Dorm Hierarchy */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Nearby Campuses Proximity Badge Card */}
          {property.nearbySchools.length > 0 && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-950 font-semibold text-xs mb-2">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Nearby Campuses & Walking Distance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {property.nearbySchools.map(ns => (
                  <div key={ns.schoolId} className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{ns.schoolShortName}</div>
                      <div className="text-[11px] text-slate-500">{ns.schoolName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-800 tabular-nums">{ns.distanceKm} km</div>
                      <div className="text-[10px] text-slate-500 font-medium">≈ {ns.walkingMinutes} min walk</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dormitory Hierarchy: Rooms & Available Beds Matrix */}
          {property.rooms.length > 0 && (
            <div className="pb-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                  Rooms & Available Beds
                </h3>
                <span className="text-xs text-slate-500">
                  Select a room for individual bed availability
                </span>
              </div>

              <div className="space-y-4">
                {property.rooms.map(room => (
                  <div key={room.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-900">{room.roomNumber}</span>
                        <div className="text-[11px] text-slate-500">
                          Floor {room.floor} · {room.capacity}-person room · {room.hasAircon ? 'Aircon' : 'Ceiling Fan'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-xs text-slate-900 tabular-nums">₱{room.pricePerBed.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-500"> / bed / mo</span>
                      </div>
                    </div>

                    {/* Beds Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {room.beds.map(bed => (
                        <div
                          key={bed.id}
                          className={`p-2.5 rounded-lg border text-center text-xs transition-colors ${
                            bed.status === 'available'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : bed.status === 'occupied'
                              ? 'bg-slate-100 border-slate-200 text-slate-400'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <div className="font-semibold text-[11px] truncate">{bed.bedLabel}</div>
                          <div className="text-[10px] uppercase font-bold mt-1 tracking-wider">
                            {bed.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="pb-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 mb-2">
              Property Description
            </h3>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="pb-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Included Student & Tenant Amenities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.amenities.map(aId => {
                const amenityObj = allAmenities.find(a => a.id === aId);
                const IconComponent = amenityObj ? AMENITY_ICONS[amenityObj.icon] || Check : Check;

                return (
                  <div key={aId} className="flex items-center gap-2.5 text-xs text-slate-800">
                    <IconComponent className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>{amenityObj ? amenityObj.name : aId}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* House Rules & Dorm Policies */}
          <div className="pb-6 border-b border-slate-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Dormitory Rules & Policies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
              <div>Curfew: <span className="font-semibold text-slate-900">{property.houseRules.curfewTime || 'No Curfew'}</span></div>
              <div>Visitors: <span className="font-semibold text-slate-900">{property.houseRules.visitorsAllowed ? 'Allowed in lounge' : 'Strictly no outside visitors'}</span></div>
              <div>Cooking: <span className="font-semibold text-slate-900">{property.houseRules.cookingAllowed ? 'Shared pantry allowed' : 'No cooking inside room'}</span></div>
              <div>Pets: <span className="font-semibold text-slate-900">{property.houseRules.petsAllowed ? 'Pets allowed' : 'No pets'}</span></div>
              <div>Smoking: <span className="font-semibold text-slate-900">{property.houseRules.smokingAllowed ? 'Permitted' : 'Strictly non-smoking'}</span></div>
            </div>
          </div>

          {/* Landlord Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {property.owner?.avatarUrl ? (
                <img
                  src={property.owner.avatarUrl}
                  alt={property.owner.name}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {property.owner?.name?.charAt(0) || 'L'}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-xs text-slate-900">{property.owner?.name}</h4>
                <p className="text-[11px] text-slate-500">{property.owner?.bio || 'Verified Property Landlord'}</p>
              </div>
            </div>

            <button
              onClick={() => onOpenMessageHost(property)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 hover:bg-white flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Landlord</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Sticky Rent & Application Module */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-5">
            {/* Rent Header */}
            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                    ₱{property.monthlyRent.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-700">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-medium tabular-nums">{property.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-slate-400">({reviews.length})</span>
                </div>
              </div>

              {property.semesterRent && (
                <div className="text-[11px] text-slate-500 mt-1">
                  Semester rate (5 months): <span className="font-semibold text-slate-800 tabular-nums">₱{property.semesterRent.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Financial Details Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Monthly Rent (per bed/space):</span>
                <span className="font-semibold text-slate-900 tabular-nums">₱{property.monthlyRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit (refundable):</span>
                <span className="font-semibold text-slate-900 tabular-nums">₱{property.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sub-metered Utility:</span>
                <span className="font-medium text-slate-900 tabular-nums">≈ ₱{property.utilityEstimate.toLocaleString()} / mo</span>
              </div>
            </div>

            {/* Application CTAs */}
            <div className="space-y-2.5">
              <button
                onClick={() => onOpenApplication(property)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for Room / Bed (Semester / Annual)</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  onReserveShortTerm({
                    property,
                    checkIn,
                    checkOut,
                    guests: 1,
                  })
                }
                className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reserve Short-term / Transient Stay
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-400">
              Tenancy applications are reviewed by the landlord prior to any payment or contract signing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
