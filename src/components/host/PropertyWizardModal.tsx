import React, { useState } from 'react';
import { Property, PropertyType, PropertyImage } from '../../types';
import { store } from '../../services/store';
import { X, Check, ArrowRight, ArrowLeft, Save, Upload, AlertCircle } from 'lucide-react';

interface PropertyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (property: Property) => void;
  initialProperty?: Property | null;
}

export const PropertyWizardModal: React.FC<PropertyWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProperty,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;

  // Wizard state across 10 steps
  const [title, setTitle] = useState(initialProperty?.title || '');
  const [propertyType, setPropertyType] = useState<PropertyType>(initialProperty?.propertyType || 'dormitory');
  const [categoryId, setCategoryId] = useState(initialProperty?.categoryId || 'cat-dorm');
  const [description, setDescription] = useState(initialProperty?.description || '');

  // Step 2: Location
  const [address, setAddress] = useState(initialProperty?.address || '');
  const [city, setCity] = useState(initialProperty?.city || 'Manila');
  const [province, setProvince] = useState(initialProperty?.province || 'Metro Manila');
  const [country, setCountry] = useState(initialProperty?.country || 'Philippines');
  const [postalCode, setPostalCode] = useState(initialProperty?.postalCode || '1008');

  // Step 3: Details
  const [bedrooms, setBedrooms] = useState(initialProperty?.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState(initialProperty?.bathrooms || 2);
  const [beds, setBeds] = useState(initialProperty?.beds || 4);
  const [maxGuests, setMaxGuests] = useState(initialProperty?.maxGuests || 4);

  // Step 4: Photos
  const [photoUrl, setPhotoUrl] = useState('');
  const [images, setImages] = useState<PropertyImage[]>(initialProperty?.images || [
    {
      id: 'img-wiz-1',
      propertyId: '',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      sortOrder: 0,
      isCover: true,
      caption: 'Main entrance and facade'
    }
  ]);

  // Step 5: Amenities
  const [amenities, setAmenities] = useState<string[]>(initialProperty?.amenities || ['amenity-wifi', 'amenity-study']);

  // Step 6: Pricing
  const [monthlyRent, setMonthlyRent] = useState(initialProperty?.monthlyRent || 5500);
  const [cleaningFee, setCleaningFee] = useState(initialProperty?.cleaningFee || 250);

  // Step 7: Availability
  const [minNights, setMinNights] = useState(2);
  const [maxNights, setMaxNights] = useState(30);

  // Step 8: House Rules
  const [checkInTime, setCheckInTime] = useState(initialProperty?.houseRules?.checkInTime || '15:00');
  const [checkOutTime, setCheckOutTime] = useState(initialProperty?.houseRules?.checkOutTime || '11:00');
  const [petsAllowed, setPetsAllowed] = useState(initialProperty?.houseRules?.petsAllowed || false);
  const [smokingAllowed, setSmokingAllowed] = useState(initialProperty?.houseRules?.smokingAllowed || false);
  const [partiesAllowed, setPartiesAllowed] = useState(initialProperty?.houseRules?.partiesAllowed || false);

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allAmenities = store.getAmenities();
  const allCategories = store.getCategories();

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return;
    const newImg: PropertyImage = {
      id: `img-${Date.now()}`,
      propertyId: initialProperty?.id || '',
      imageUrl: photoUrl.trim(),
      sortOrder: images.length,
      isCover: images.length === 0,
    };
    setImages([...images, newImg]);
    setPhotoUrl('');
  };

  const handleRemovePhoto = (idx: number) => {
    const updated = images.filter((_, i) => i !== idx);
    if (updated.length > 0 && !updated.some(img => img.isCover)) {
      updated[0].isCover = true;
    }
    setImages(updated);
  };

  const toggleAmenity = (id: string) => {
    setAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Step validations
  const validateCurrentStep = (): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim() || title.length < 5) {
        setError('Please enter a descriptive property title (at least 5 characters).');
        return false;
      }
      if (!description.trim() || description.length < 20) {
        setError('Please provide an architectural description (at least 20 characters).');
        return false;
      }
    } else if (currentStep === 2) {
      if (!city.trim() || !country.trim() || !address.trim()) {
        setError('Please specify city, country, and physical address.');
        return false;
      }
    } else if (currentStep === 3) {
      if (maxGuests < 1 || bedrooms < 1 || bathrooms < 1) {
        setError('Guests, bedrooms, and bathrooms must be at least 1.');
        return false;
      }
    } else if (currentStep === 4) {
      if (images.length === 0) {
        setError('Please provide at least one photo for this stay.');
        return false;
      }
    } else if (currentStep === 6) {
      if (monthlyRent < 1000) {
        setError('Monthly rent must be at least ₱1,000.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(s => Math.min(totalSteps, s + 1));
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep(s => Math.max(1, s - 1));
  };

  const buildPropertyPayload = (): Partial<Property> => ({
    id: initialProperty?.id,
    title: title.trim(),
    categoryId,
    propertyType,
    description: description.trim(),
    address: address.trim(),
    city: city.trim(),
    province: province.trim(),
    country: country.trim(),
    postalCode: postalCode.trim(),
    bedrooms,
    bathrooms,
    beds,
    maxGuests,
    monthlyRent,
    pricePerNight: Math.round(monthlyRent / 30),
    cleaningFee,
    amenities,
    images,
    houseRules: {
      checkInTime,
      checkOutTime,
      petsAllowed,
      smokingAllowed,
      partiesAllowed,
      visitorsAllowed: true,
      cookingAllowed: true,
    },
  });

  const handleSaveDraft = () => {
    try {
      const saved = store.saveHostProperty(buildPropertyPayload(), false);
      onSuccess(saved);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSubmitForApproval = () => {
    if (!validateCurrentStep()) return;
    try {
      const submitted = store.saveHostProperty(buildPropertyPayload(), true);
      onSuccess(submitted);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200">
        
        {/* Top Wizard Navigation */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              Host Creation Wizard · Step {currentStep} of {totalSteps}
            </div>
            <h3 className="font-semibold text-stone-900 text-sm">
              {currentStep === 1 && 'Basic Information'}
              {currentStep === 2 && 'Location & Geography'}
              {currentStep === 3 && 'Spaces & Guest Capacity'}
              {currentStep === 4 && 'Architectural Photography'}
              {currentStep === 5 && 'Sanctuary Amenities'}
              {currentStep === 6 && 'Nightly Rates & Fees'}
              {currentStep === 7 && 'Availability & Stay Limits'}
              {currentStep === 8 && 'House Rules & Guest Etiquette'}
              {currentStep === 9 && 'Review Sanctuary Profile'}
              {currentStep === 10 && 'Submit for Admin Curation'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-1">
          <div
            className="bg-stone-900 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Scrollable Wizard Steps Body */}
        <div className="p-6 overflow-y-auto text-left flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Property Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. The Solarium Cliffside Sanctuary"
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    {allCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Architectural Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={e => setPropertyType(e.target.value as PropertyType)}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white capitalize"
                  >
                    {['villa', 'chalet', 'sanctuary', 'loft', 'cabin', 'estate'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Detail the architectural materials, natural light, views, and unique atmosphere..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 47200 Highway 1"
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Big Sur"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    placeholder="California"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="United States"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="93920"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Max Guests</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={maxGuests}
                  onChange={e => setMaxGuests(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bedrooms}
                  onChange={e => setBedrooms(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Beds</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={beds}
                  onChange={e => setBeds(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={bathrooms}
                  onChange={e => setBathrooms(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={photoUrl}
                  onChange={e => setPhotoUrl(e.target.value)}
                  placeholder="Paste architectural image URL..."
                  className="flex-1 p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 group">
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    {img.isCover && (
                      <span className="absolute top-2 left-2 bg-stone-900/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Amenities */}
          {currentStep === 5 && (
            <div>
              <div className="text-xs text-stone-500 mb-3">Select available amenities:</div>
              <div className="grid grid-cols-2 gap-2">
                {allAmenities.map(a => {
                  const active = amenities.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAmenity(a.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        active ? 'border-stone-900 bg-stone-100 font-medium' : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        active ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-300'
                      }`}>
                        {active && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className="truncate">{a.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Pricing */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Monthly Rent per Bed / Room (₱ PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 text-xs">₱</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cleaning & Move-in Sanitization Fee (₱ PHP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 text-xs">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={cleaningFee}
                    onChange={e => setCleaningFee(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Availability */}
          {currentStep === 7 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Minimum Nights</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={minNights}
                  onChange={e => setMinNights(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Maximum Nights</label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={maxNights}
                  onChange={e => setMaxNights(Number(e.target.value))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>
            </div>
          )}

          {/* STEP 8: House Rules */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Check-in After</label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={e => setCheckInTime(e.target.value)}
                    className="w-full p-2 text-xs border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Checkout Before</label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    className="w-full p-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={petsAllowed}
                    onChange={e => setPetsAllowed(e.target.checked)}
                    className="rounded"
                  />
                  <span>Pets allowed on premises</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smokingAllowed}
                    onChange={e => setSmokingAllowed(e.target.checked)}
                    className="rounded"
                  />
                  <span>Smoking allowed (outdoors only)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partiesAllowed}
                    onChange={e => setPartiesAllowed(e.target.checked)}
                    className="rounded"
                  />
                  <span>Events or small gatherings permitted</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 9: Review Summary */}
          {currentStep === 9 && (
            <div className="p-4 bg-stone-50 rounded-xl space-y-3 text-xs">
              <div className="font-semibold text-stone-900 border-b pb-2">Listing Summary Preview</div>
              <div><span className="text-stone-500">Title:</span> <span className="font-medium text-stone-900">{title}</span></div>
              <div><span className="text-stone-500">Location:</span> <span className="font-medium text-stone-900">{city}, {country}</span></div>
              <div><span className="text-stone-500">Capacity:</span> <span className="font-medium text-stone-900">{maxGuests} guests · {bedrooms} beds · {bathrooms} baths</span></div>
              <div><span className="text-stone-500">Rent:</span> <span className="font-medium text-stone-900">₱{monthlyRent.toLocaleString()} / month</span></div>
              <div><span className="text-stone-500">Amenities:</span> <span className="font-medium text-stone-900">{amenities.length} selected</span></div>
              <div><span className="text-stone-500">Photos:</span> <span className="font-medium text-stone-900">{images.length} photos</span></div>
            </div>
          )}

          {/* STEP 10: Submit */}
          {currentStep === 10 && (
            <div className="text-center py-6 space-y-3">
              <Check className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-lg text-stone-900">Ready for Curation Review</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                By submitting, your listing enters the platform quality queue. Our curation team audits high-res photos and local verification before going live.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-700 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-700 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
          </div>

          <div>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitForApproval}
                className="px-6 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 shadow-sm cursor-pointer"
              >
                Submit for Admin Approval
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
