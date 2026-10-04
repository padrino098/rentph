export type UserRole = 'student' | 'renter' | 'host' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'pending' | 'banned';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  bio?: string;
  schoolId?: string;
  schoolName?: string;
  courseAndYear?: string;
  isVerifiedStudent?: boolean;
  isSuperhost?: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';

export type PropertyType =
  | 'dormitory'
  | 'bedspace'
  | 'private_room'
  | 'shared_room'
  | 'apartment'
  | 'condo'
  | 'house'
  | 'boarding_house'
  | 'studio'
  | 'townhouse';

export type GenderPolicy = 'all' | 'female_only' | 'male_only' | 'coed_mixed';

export type RentalPeriod = 'monthly' | 'semester' | 'daily' | 'yearly';

export interface School {
  id: string;
  name: string;
  shortName: string;
  city: string;
  province: string;
  address: string;
  latitude: number;
  longitude: number;
  nearestTransit?: string;
  logoUrl?: string;
}

export interface NearbySchoolDistance {
  schoolId: string;
  schoolName: string;
  schoolShortName: string;
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
}

export interface DormBed {
  id: string;
  roomId: string;
  bedLabel: string; // e.g. 'Bed A (Lower Deck)', 'Bed B (Upper Deck)'
  deckLevel: 'lower' | 'upper' | 'single';
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  currentTenantId?: string;
  currentTenantName?: string;
  monthlyRate: number;
}

export interface DormRoom {
  id: string;
  propertyId: string;
  roomNumber: string; // e.g. 'Room 101', 'Room 204'
  floor: number;
  roomType: 'solo' | '2_person' | '3_person' | '4_person' | '6_person';
  capacity: number;
  pricePerBed: number;
  priceEntireRoom?: number;
  hasAircon: boolean;
  hasPrivateBath: boolean;
  beds: DormBed[];
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  imageUrl: string;
  storageKey?: string;
  sortOrder: number;
  isCover: boolean;
  caption?: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: 'essentials' | 'study' | 'security' | 'services' | 'lifestyle';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
}

export interface HouseRules {
  curfewTime?: string; // e.g. '10:00 PM', '11:00 PM', 'No Curfew'
  visitorsAllowed: boolean;
  cookingAllowed: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  quietHoursStart?: string;
  checkInTime?: string;
  checkOutTime?: string;
  additionalRules?: string[];
}

export interface Property {
  id: string;
  ownerId: string;
  owner?: User;
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  propertyType: PropertyType;
  genderPolicy: GenderPolicy;
  allowedRentalPeriods: RentalPeriod[];
  address: string;
  barangay?: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  maxGuests: number;
  monthlyRent: number; // Primary pricing in ₱ PHP
  pricePerNight?: number;
  dailyRent?: number;
  semesterRent?: number;
  securityDeposit: number;
  utilityEstimate: number;
  cleaningFee: number;
  serviceFeePercent?: number;
  status: PropertyStatus;
  rejectionReason?: string;
  featured: boolean;
  amenities: string[]; // amenity IDs
  images: PropertyImage[];
  houseRules: HouseRules;
  nearbySchools: NearbySchoolDistance[];
  rooms: DormRoom[];
  totalBedsCount: number;
  availableBedsCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  reviewsCount?: number;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

export interface RentalApplication {
  id: string;
  applicationCode: string;
  propertyId: string;
  propertyTitle: string;
  roomId?: string;
  roomNumber?: string;
  bedId?: string;
  bedLabel?: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantRole: UserRole;
  schoolOrCompany: string;
  studentIdOrGovtId?: string;
  guardianName?: string;
  guardianPhone?: string;
  targetMoveInDate: string;
  intendedMonths: number;
  monthlyRent: number;
  securityDeposit: number;
  messageToLandlord?: string;
  status: ApplicationStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired' | 'rejected';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Booking {
  id: string;
  bookingCode: string;
  propertyId: string;
  property?: Property;
  roomId?: string;
  bedId?: string;
  renterId: string;
  renter?: User;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  nights: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationReason?: string;
  specialRequests?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId?: string;
  applicationId?: string;
  provider: 'rentph_pay' | 'gcash' | 'maya' | 'stripe' | 'card' | 'apple_pay';
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  cardBrand?: string;
  cardLast4?: string;
  paidAt?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId?: string;
  applicationId?: string;
  propertyId: string;
  renterId: string;
  renter?: User;
  rating: number; // 1-5
  cleanlinessRating: number;
  accuracyRating: number;
  locationRating: number;
  communicationRating: number;
  comment: string;
  createdAt: string;
}

export interface BlockedDate {
  id: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: 'maintenance' | 'owner_stay' | 'renovation' | 'other';
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  renterId: string;
  renterName: string;
  ownerId: string;
  ownerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'property' | 'booking' | 'payment' | 'user' | 'platform_settings' | 'application' | 'room' | 'bed';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettings {
  serviceFeePercent: number;
  instantBookingDefault: boolean;
  pendingExpirationMinutes: number;
  platformCurrency: string; // 'PHP'
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
}

export interface SearchFilters {
  location?: string;
  schoolId?: string;
  maxDistanceKm?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  propertyType?: string;
  genderPolicy?: GenderPolicy;
  amenities?: string[];
  hasAircon?: boolean;
  hasStudyArea?: boolean;
  hasWifi?: boolean;
  curfewOption?: 'any' | 'no_curfew' | 'with_curfew';
  rentalPeriod?: RentalPeriod;
  sortBy?: 'nearest_school' | 'price_asc' | 'price_desc' | 'rating' | 'recommended' | 'newest';
}

export interface PricingCalculation {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  discount: number;
  discountDescription?: string;
  total: number;
}
