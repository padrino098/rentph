import {
  User, Property, Category, Amenity, Booking, Payment, Review,
  BlockedDate, PlatformSettings, AuditLog, Conversation, Message,
  SearchFilters, PropertyStatus, UserStatus, UserRole, School,
  RentalApplication, DormBed
} from '../types';
import {
  SEED_USERS, SEED_PROPERTIES, SEED_CATEGORIES, SEED_AMENITIES,
  SEED_BOOKINGS, SEED_REVIEWS, SEED_BLOCKED_DATES, SEED_SETTINGS,
  SEED_AUDIT_LOGS, SEED_CONVERSATIONS, SEED_MESSAGES, SEED_SCHOOLS,
  SEED_APPLICATIONS
} from '../data/seedData';
import { AvailabilityEngine } from './availabilityEngine';
import { PricingEngine } from './pricingEngine';
import { DistanceService } from './distanceService';

const STORAGE_KEY = 'rentph_student_marketplace_v2';

interface DatabaseSchema {
  users: User[];
  schools: School[];
  properties: Property[];
  categories: Category[];
  amenities: Amenity[];
  applications: RentalApplication[];
  bookings: Booking[];
  payments: Payment[];
  reviews: Review[];
  blockedDates: BlockedDate[];
  conversations: Conversation[];
  messages: Message[];
  favorites: string[];
  comparedPropertyIds: string[];
  auditLogs: AuditLog[];
  settings: PlatformSettings;
  currentUserId: string;
}

class AppStore {
  private data: DatabaseSchema;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DatabaseSchema;
        if (parsed.properties && parsed.users && parsed.schools) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    const initial: DatabaseSchema = {
      users: [...SEED_USERS],
      schools: [...SEED_SCHOOLS],
      properties: [...SEED_PROPERTIES],
      categories: [...SEED_CATEGORIES],
      amenities: [...SEED_AMENITIES],
      applications: [...SEED_APPLICATIONS],
      bookings: [...SEED_BOOKINGS],
      payments: [
        {
          id: 'pay-101',
          bookingId: 'book-rph-101',
          provider: 'rentph_pay',
          providerPaymentId: 'ch_rph_984128941',
          amount: 6564,
          currency: 'PHP',
          status: 'paid',
          cardBrand: 'GCash',
          cardLast4: '8901',
          paidAt: '2026-10-02T15:20:00Z',
          receiptUrl: '#receipt-rph-101',
          createdAt: '2026-10-02T15:15:00Z',
        },
      ],
      reviews: [...SEED_REVIEWS],
      blockedDates: [...SEED_BLOCKED_DATES],
      conversations: [...SEED_CONVERSATIONS],
      messages: [...SEED_MESSAGES],
      favorites: ['prop-ust-tower', 'prop-katipunan-blue'],
      comparedPropertyIds: ['prop-ust-tower', 'prop-taft-green'],
      auditLogs: [...SEED_AUDIT_LOGS],
      settings: { ...SEED_SETTINGS },
      currentUserId: 'user-student-1', // Default student: Keneth Jassal
    };

    this.persist(initial);
    return initial;
  }

  private persist(data: DatabaseSchema = this.data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  private notify() {
    this.persist();
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadOrSeed();
    this.notify();
  }

  // ===================== AUTH & USERS =====================

  public getCurrentUser(): User {
    const user = this.data.users.find(u => u.id === this.data.currentUserId);
    return user || this.data.users[0];
  }

  public setCurrentUser(userId: string) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      this.data.currentUserId = userId;
      this.notify();
    }
  }

  public getUsers(): User[] {
    return [...this.data.users];
  }

  public updateUserStatus(userId: string, status: UserStatus, adminReason?: string): boolean {
    const admin = this.getCurrentUser();
    if (admin.role !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;

    const oldStatus = user.status;
    user.status = status;
    user.updatedAt = new Date().toISOString();

    this.logAudit(
      admin.id,
      admin.name,
      admin.role,
      'USER_STATUS_CHANGE',
      'user',
      userId,
      `Changed user status from ${oldStatus} to ${status}. ${adminReason ? `Reason: ${adminReason}` : ''}`
    );

    this.notify();
    return true;
  }

  public updateUserRole(userId: string, role: UserRole): boolean {
    const admin = this.getCurrentUser();
    if (admin.role !== 'admin') throw new Error('Unauthorized: Admin access required.');

    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;

    user.role = role;
    user.updatedAt = new Date().toISOString();

    this.logAudit(
      admin.id,
      admin.name,
      admin.role,
      'USER_ROLE_CHANGE',
      'user',
      userId,
      `Assigned role ${role} to user ${user.name}`
    );

    this.notify();
    return true;
  }

  public registerUser(name: string, email: string, role: UserRole = 'student', schoolId?: string): User {
    const existing = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const school = schoolId ? this.data.schools.find(s => s.id === schoolId) : undefined;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      status: 'active',
      schoolId: school?.id,
      schoolName: school?.name,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.data.currentUserId = newUser.id;
    this.notify();
    return newUser;
  }

  // ===================== SCHOOLS & LOCATIONS =====================

  public getSchools(): School[] {
    return [...this.data.schools];
  }

  public getSchoolById(schoolId: string): School | undefined {
    return this.data.schools.find(s => s.id === schoolId);
  }

  // ===================== PROPERTIES SEARCH & PROXIMITY =====================

  public getProperties(
    filters: SearchFilters = {},
    page = 1,
    pageSize = 12
  ): { properties: Property[]; total: number; totalPages: number } {
    let list = this.data.properties.filter(p => p.status === 'approved');

    const selectedSchool = filters.schoolId
      ? this.data.schools.find(s => s.id === filters.schoolId)
      : undefined;

    // Filter by location query (text match on city, barangay, address, title, nearby schools)
    if (filters.location && filters.location.trim()) {
      const q = filters.location.toLowerCase().trim();
      list = list.filter(p =>
        p.city.toLowerCase().includes(q) ||
        (p.barangay && p.barangay.toLowerCase().includes(q)) ||
        p.address.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.nearbySchools.some(
          ns =>
            ns.schoolName.toLowerCase().includes(q) ||
            ns.schoolShortName.toLowerCase().includes(q)
        )
      );
    }

    // Filter by school & calculate live distance if school selected
    if (selectedSchool) {
      list = list.map(p => {
        const commute = DistanceService.estimateCommute(
          p.latitude,
          p.longitude,
          selectedSchool.latitude,
          selectedSchool.longitude
        );

        // Ensure this school is at the top of nearbySchools
        const existingIdx = p.nearbySchools.findIndex(
          ns => ns.schoolId === selectedSchool.id
        );
        const updatedNearby = [...p.nearbySchools];
        if (existingIdx >= 0) {
          updatedNearby[existingIdx] = {
            schoolId: selectedSchool.id,
            schoolName: selectedSchool.name,
            schoolShortName: selectedSchool.shortName,
            distanceKm: commute.distanceKm,
            walkingMinutes: commute.walkingMinutes,
            drivingMinutes: commute.drivingMinutes,
          };
        } else {
          updatedNearby.unshift({
            schoolId: selectedSchool.id,
            schoolName: selectedSchool.name,
            schoolShortName: selectedSchool.shortName,
            distanceKm: commute.distanceKm,
            walkingMinutes: commute.walkingMinutes,
            drivingMinutes: commute.drivingMinutes,
          });
        }

        return {
          ...p,
          nearbySchools: updatedNearby,
        };
      });

      // Filter by max distance to school if specified
      if (filters.maxDistanceKm && filters.maxDistanceKm > 0) {
        list = list.filter(p => {
          const match = p.nearbySchools.find(
            ns => ns.schoolId === selectedSchool.id
          );
          return match ? match.distanceKm <= filters.maxDistanceKm! : true;
        });
      }
    }

    // Filter by category
    if (filters.categoryId) {
      list = list.filter(p => p.categoryId === filters.categoryId);
    }

    // Filter by property type
    if (filters.propertyType && filters.propertyType !== 'all') {
      list = list.filter(p => p.propertyType === filters.propertyType);
    }

    // Filter by gender policy
    if (filters.genderPolicy && filters.genderPolicy !== 'all') {
      list = list.filter(
        p => p.genderPolicy === filters.genderPolicy || p.genderPolicy === 'all'
      );
    }

    // Filter by budget / rent
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      list = list.filter(p => p.monthlyRent >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      list = list.filter(p => p.monthlyRent <= filters.maxPrice!);
    }

    // Filter by specific amenities
    if (filters.amenities && filters.amenities.length > 0) {
      list = list.filter(p =>
        filters.amenities!.every(aId => p.amenities.includes(aId))
      );
    }

    // Filter by curfew preferences
    if (filters.curfewOption === 'no_curfew') {
      list = list.filter(
        p =>
          p.houseRules.curfewTime?.toLowerCase().includes('no curfew') ||
          p.amenities.includes('amenity-curfew-free')
      );
    } else if (filters.curfewOption === 'with_curfew') {
      list = list.filter(
        p =>
          p.houseRules.curfewTime &&
          !p.houseRules.curfewTime.toLowerCase().includes('no curfew')
      );
    }

    // Sorting
    const sort = filters.sortBy || 'recommended';
    if (sort === 'nearest_school' && selectedSchool) {
      list.sort((a, b) => {
        const distA =
          a.nearbySchools.find(ns => ns.schoolId === selectedSchool.id)
            ?.distanceKm || 999;
        const distB =
          b.nearbySchools.find(ns => ns.schoolId === selectedSchool.id)
            ?.distanceKm || 999;
        return distA - distB;
      });
    } else if (sort === 'price_asc') {
      list.sort((a, b) => a.monthlyRent - b.monthlyRent);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.monthlyRent - a.monthlyRent);
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'newest') {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // recommended: featured first, then rating
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
    }

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    const enriched = paginated.map(p => ({
      ...p,
      owner: this.data.users.find(u => u.id === p.ownerId),
    }));

    return { properties: enriched, total, totalPages };
  }

  public getPropertyById(id: string): Property | undefined {
    const prop = this.data.properties.find(p => p.id === id);
    if (!prop) return undefined;
    return {
      ...prop,
      owner: this.data.users.find(u => u.id === prop.ownerId),
    };
  }

  public getAllPropertiesForAdmin(): Property[] {
    return this.data.properties.map(p => ({
      ...p,
      owner: this.data.users.find(u => u.id === p.ownerId),
    }));
  }

  public getHostProperties(hostId: string): Property[] {
    return this.data.properties.filter(p => p.ownerId === hostId);
  }

  // ===================== DORM ROOM & BED MANAGEMENT =====================

  public updateBedStatus(
    bedId: string,
    newStatus: DormBed['status'],
    tenantName?: string
  ): boolean {
    const user = this.getCurrentUser();

    for (const prop of this.data.properties) {
      for (const room of prop.rooms) {
        const bed = room.beds.find(b => b.id === bedId);
        if (bed) {
          if (prop.ownerId !== user.id && user.role !== 'admin') {
            throw new Error('Unauthorized to manage this property.');
          }

          bed.status = newStatus;
          bed.currentTenantName = newStatus === 'occupied' ? tenantName : undefined;

          // Re-count available beds
          const allBeds = prop.rooms.flatMap(r => r.beds);
          prop.totalBedsCount = allBeds.length;
          prop.availableBedsCount = allBeds.filter(
            b => b.status === 'available'
          ).length;

          this.logAudit(
            user.id,
            user.name,
            user.role,
            'BED_STATUS_UPDATED',
            'bed',
            bedId,
            `Bed ${bed.bedLabel} in ${room.roomNumber} set to ${newStatus}.`
          );

          this.notify();
          return true;
        }
      }
    }
    return false;
  }

  // ===================== RENTAL APPLICATIONS =====================

  public submitRentalApplication(params: {
    propertyId: string;
    roomId?: string;
    bedId?: string;
    targetMoveInDate: string;
    intendedMonths: number;
    schoolOrCompany: string;
    studentIdOrGovtId?: string;
    guardianName?: string;
    guardianPhone?: string;
    messageToLandlord?: string;
  }): RentalApplication {
    const applicant = this.getCurrentUser();
    const property = this.getPropertyById(params.propertyId);
    if (!property) throw new Error('Property not found');

    let roomNumber = '';
    let bedLabel = '';
    let monthlyRent = property.monthlyRent;

    if (params.roomId) {
      const room = property.rooms.find(r => r.id === params.roomId);
      if (room) {
        roomNumber = room.roomNumber;
        if (params.bedId) {
          const bed = room.beds.find(b => b.id === params.bedId);
          if (bed) {
            bedLabel = bed.bedLabel;
            monthlyRent = bed.monthlyRate;
            // Mark bed as reserved during application review
            bed.status = 'reserved';
          }
        }
      }
    }

    const applicationCode = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: RentalApplication = {
      id: `app-${Date.now()}`,
      applicationCode,
      propertyId: property.id,
      propertyTitle: property.title,
      roomId: params.roomId,
      roomNumber: roomNumber || undefined,
      bedId: params.bedId,
      bedLabel: bedLabel || undefined,
      applicantId: applicant.id,
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantPhone: applicant.phone || '+63 900 000 0000',
      applicantRole: applicant.role,
      schoolOrCompany: params.schoolOrCompany,
      studentIdOrGovtId: params.studentIdOrGovtId,
      guardianName: params.guardianName,
      guardianPhone: params.guardianPhone,
      targetMoveInDate: params.targetMoveInDate,
      intendedMonths: params.intendedMonths,
      monthlyRent,
      securityDeposit: property.securityDeposit || monthlyRent,
      messageToLandlord: params.messageToLandlord,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.applications.unshift(newApp);

    this.logAudit(
      applicant.id,
      applicant.name,
      applicant.role,
      'RENTAL_APPLICATION_SUBMITTED',
      'application',
      newApp.id,
      `Submitted lease application ${applicationCode} for "${property.title}".`
    );

    this.notify();
    return newApp;
  }

  public updateApplicationStatus(
    applicationId: string,
    status: RentalApplication['status'],
    rejectionReason?: string
  ): boolean {
    const user = this.getCurrentUser();
    const app = this.data.applications.find(a => a.id === applicationId);
    if (!app) return false;

    const property = this.getPropertyById(app.propertyId);
    if (property?.ownerId !== user.id && user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    app.status = status;
    app.rejectionReason = rejectionReason;
    app.updatedAt = new Date().toISOString();

    // If approved, mark bed as occupied by applicant
    if (status === 'approved' && app.bedId) {
      this.updateBedStatus(app.bedId, 'occupied', app.applicantName);
    } else if (status === 'rejected' && app.bedId) {
      this.updateBedStatus(app.bedId, 'available');
    }

    this.logAudit(
      user.id,
      user.name,
      user.role,
      `APPLICATION_${status.toUpperCase()}`,
      'application',
      applicationId,
      `Application ${app.applicationCode} status updated to ${status}.`
    );

    this.notify();
    return true;
  }

  public getApplicationsForUser(userId: string): RentalApplication[] {
    return this.data.applications.filter(a => a.applicantId === userId);
  }

  public getApplicationsForHost(hostId: string): RentalApplication[] {
    const hostPropIds = new Set(
      this.data.properties.filter(p => p.ownerId === hostId).map(p => p.id)
    );
    return this.data.applications.filter(a => hostPropIds.has(a.propertyId));
  }

  // ===================== PROPERTY COMPARISON =====================

  public getComparedProperties(): Property[] {
    return this.data.comparedPropertyIds
      .map(id => this.getPropertyById(id))
      .filter((p): p is Property => Boolean(p));
  }

  public toggleCompareProperty(propertyId: string): boolean {
    const idx = this.data.comparedPropertyIds.indexOf(propertyId);
    if (idx >= 0) {
      this.data.comparedPropertyIds.splice(idx, 1);
    } else {
      if (this.data.comparedPropertyIds.length >= 3) {
        this.data.comparedPropertyIds.shift(); // remove oldest to keep max 3
      }
      this.data.comparedPropertyIds.push(propertyId);
    }
    this.notify();
    return idx === -1;
  }

  public getComparedPropertyIds(): string[] {
    return [...this.data.comparedPropertyIds];
  }

  public isCompared(propertyId: string): boolean {
    return this.data.comparedPropertyIds.includes(propertyId);
  }

  public clearComparison() {
    this.data.comparedPropertyIds = [];
    this.notify();
  }

  // ===================== PROPERTY CREATION & MODERATION =====================

  public saveHostProperty(
    propertyData: Partial<Property>,
    submitForApproval = false
  ): Property {
    const currentUser = this.getCurrentUser();
    if (currentUser.role !== 'host' && currentUser.role !== 'admin') {
      throw new Error(
        'Unauthorized: Only registered landlords or admins can publish properties.'
      );
    }

    const now = new Date().toISOString();
    let prop: Property;

    if (propertyData.id) {
      const idx = this.data.properties.findIndex(p => p.id === propertyData.id);
      if (idx === -1) throw new Error('Property not found');

      if (
        this.data.properties[idx].ownerId !== currentUser.id &&
        currentUser.role !== 'admin'
      ) {
        throw new Error('Forbidden: You can only edit your own properties.');
      }

      prop = {
        ...this.data.properties[idx],
        ...propertyData,
        status: submitForApproval
          ? 'pending'
          : propertyData.status || this.data.properties[idx].status,
        updatedAt: now,
      };
      this.data.properties[idx] = prop;
    } else {
      const id = `prop-${Date.now()}`;
      prop = {
        id,
        ownerId: currentUser.id,
        categoryId: propertyData.categoryId || 'cat-dorm',
        title: propertyData.title || 'Untitled Student Dorm',
        slug: (propertyData.title || 'untitled')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-'),
        description: propertyData.description || '',
        propertyType: propertyData.propertyType || 'dormitory',
        genderPolicy: propertyData.genderPolicy || 'coed_mixed',
        allowedRentalPeriods: propertyData.allowedRentalPeriods || [
          'semester',
          'monthly',
        ],
        address: propertyData.address || '',
        barangay: propertyData.barangay || '',
        city: propertyData.city || 'Manila',
        province: propertyData.province || 'Metro Manila',
        country: propertyData.country || 'Philippines',
        postalCode: propertyData.postalCode || '1008',
        latitude: propertyData.latitude || 14.6091,
        longitude: propertyData.longitude || 120.9899,
        bedrooms: propertyData.bedrooms || 4,
        bathrooms: propertyData.bathrooms || 4,
        beds: propertyData.beds || 8,
        maxGuests: propertyData.maxGuests || 8,
        monthlyRent: propertyData.monthlyRent || 5500,
        securityDeposit: propertyData.securityDeposit || 5500,
        utilityEstimate: propertyData.utilityEstimate || 600,
        cleaningFee: propertyData.cleaningFee || 250,
        serviceFeePercent: this.data.settings.serviceFeePercent,
        status: submitForApproval ? 'pending' : 'draft',
        featured: false,
        amenities: propertyData.amenities || ['amenity-wifi', 'amenity-study'],
        images: propertyData.images || [],
        houseRules: propertyData.houseRules || {
          curfewTime: '11:00 PM',
          visitorsAllowed: true,
          cookingAllowed: true,
          petsAllowed: false,
          smokingAllowed: false,
          partiesAllowed: false,
        },
        nearbySchools: propertyData.nearbySchools || [],
        rooms: propertyData.rooms || [],
        totalBedsCount: propertyData.totalBedsCount || 8,
        availableBedsCount: propertyData.availableBedsCount || 8,
        createdAt: now,
        updatedAt: now,
      };
      this.data.properties.unshift(prop);
    }

    this.logAudit(
      currentUser.id,
      currentUser.name,
      currentUser.role,
      submitForApproval
        ? 'PROPERTY_SUBMITTED_FOR_APPROVAL'
        : 'PROPERTY_SAVED_DRAFT',
      'property',
      prop.id,
      `Property "${prop.title}" ${submitForApproval ? 'submitted for admin curation review.' : 'saved as draft.'}`
    );

    this.notify();
    return prop;
  }

  public updatePropertyModeration(
    propertyId: string,
    status: 'approved' | 'rejected' | 'suspended',
    rejectionReason?: string
  ): boolean {
    const admin = this.getCurrentUser();
    if (admin.role !== 'admin')
      throw new Error('Unauthorized: Admin access required.');

    const prop = this.data.properties.find(p => p.id === propertyId);
    if (!prop) return false;

    prop.status = status;
    prop.rejectionReason = rejectionReason;
    prop.updatedAt = new Date().toISOString();
    if (status === 'approved' && !prop.publishedAt) {
      prop.publishedAt = new Date().toISOString();
    }

    this.logAudit(
      admin.id,
      admin.name,
      admin.role,
      `PROPERTY_MODERATION_${status.toUpperCase()}`,
      'property',
      propertyId,
      `Moderator status set to: ${status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`
    );

    this.notify();
    return true;
  }

  // ===================== AVAILABILITY & BLOCKED DATES =====================

  public getBlockedDates(propertyId: string): BlockedDate[] {
    return this.data.blockedDates.filter(b => b.propertyId === propertyId);
  }

  public blockHostDates(
    propertyId: string,
    startDate: string,
    endDate: string,
    reason: BlockedDate['reason']
  ): BlockedDate {
    const user = this.getCurrentUser();
    const prop = this.data.properties.find(p => p.id === propertyId);
    if (!prop || (prop.ownerId !== user.id && user.role !== 'admin')) {
      throw new Error(
        'Unauthorized: You can only manage availability for your properties.'
      );
    }

    const blocked: BlockedDate = {
      id: `block-${Date.now()}`,
      propertyId,
      startDate,
      endDate,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.data.blockedDates.push(blocked);
    this.notify();
    return blocked;
  }

  public unblockHostDates(blockedDateId: string): boolean {
    const user = this.getCurrentUser();
    const index = this.data.blockedDates.findIndex(b => b.id === blockedDateId);
    if (index === -1) return false;

    const prop = this.data.properties.find(
      p => p.id === this.data.blockedDates[index].propertyId
    );
    if (!prop || (prop.ownerId !== user.id && user.role !== 'admin')) {
      throw new Error('Unauthorized');
    }

    this.data.blockedDates.splice(index, 1);
    this.notify();
    return true;
  }

  // ===================== BOOKINGS =====================

  public createBooking(params: {
    propertyId: string;
    roomId?: string;
    bedId?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    specialRequests?: string;
    paymentMethod: {
      cardBrand?: string;
      cardLast4?: string;
    };
  }): { booking: Booking; payment: Payment } {
    const renter = this.getCurrentUser();
    if (renter.status !== 'active') {
      throw new Error('Account suspended or inactive. Please contact support.');
    }

    const property = this.getPropertyById(params.propertyId);
    if (!property) {
      throw new Error('Property not found.');
    }

    const availCheck = AvailabilityEngine.verifyAvailability(
      property,
      params.checkIn,
      params.checkOut,
      params.guests,
      this.data.bookings,
      this.data.blockedDates
    );

    if (!availCheck.available) {
      throw new Error(
        availCheck.error ||
          'Requested dates are no longer available. Please select another interval.'
      );
    }

    const pricing = PricingEngine.calculate(
      property,
      params.checkIn,
      params.checkOut,
      params.guests,
      this.data.settings.serviceFeePercent
    );

    const now = new Date().toISOString();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const bookingCode = `RPH-${randomSuffix}`;
    const bookingId = `book-${Date.now()}`;

    const newBooking: Booking = {
      id: bookingId,
      bookingCode,
      propertyId: property.id,
      roomId: params.roomId,
      bedId: params.bedId,
      renterId: renter.id,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests,
      nights: pricing.nights,
      nightlyRate: pricing.nightlyRate,
      subtotal: pricing.subtotal,
      cleaningFee: pricing.cleaningFee,
      serviceFee: pricing.serviceFee,
      discount: pricing.discount,
      total: pricing.total,
      status: 'confirmed',
      paymentStatus: 'paid',
      specialRequests: params.specialRequests,
      confirmedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      provider: 'rentph_pay',
      providerPaymentId: `ch_${Date.now()}_${randomSuffix}`,
      amount: pricing.total,
      currency: this.data.settings.platformCurrency,
      status: 'paid',
      cardBrand: params.paymentMethod.cardBrand || 'GCash',
      cardLast4: params.paymentMethod.cardLast4 || '8901',
      paidAt: now,
      receiptUrl: `#receipt-${bookingCode.toLowerCase()}`,
      createdAt: now,
    };

    this.data.bookings.push(newBooking);
    this.data.payments.push(newPayment);

    // If bed is specified, mark occupied
    if (params.bedId) {
      this.updateBedStatus(params.bedId, 'occupied', renter.name);
    }

    const existingConv = this.data.conversations.find(
      c => c.propertyId === property.id && c.renterId === renter.id
    );

    const convId = existingConv ? existingConv.id : `conv-${Date.now()}`;
    if (!existingConv) {
      const cover = property.images[0]?.imageUrl || '';
      this.data.conversations.push({
        id: convId,
        propertyId: property.id,
        propertyTitle: property.title,
        propertyImage: cover,
        renterId: renter.id,
        renterName: renter.name,
        ownerId: property.ownerId,
        ownerName: property.owner?.name || 'Landlord',
        lastMessage: `Booking confirmed: ${newBooking.checkIn} to ${newBooking.checkOut}`,
        lastMessageAt: now,
        unreadCount: 1,
      });
    }

    this.data.messages.push({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderId: 'system',
      senderName: 'RentPH Concierge',
      text: `Reservation ${bookingCode} confirmed (${params.checkIn} → ${params.checkOut}). Total paid: ₱${pricing.total.toLocaleString()}.`,
      createdAt: now,
    });

    this.logAudit(
      renter.id,
      renter.name,
      renter.role,
      'BOOKING_CREATED_AND_PAID',
      'booking',
      bookingId,
      `Reservation ${bookingCode} booked at "${property.title}" for ₱${pricing.total}.`
    );

    this.notify();
    return { booking: newBooking, payment: newPayment };
  }

  public cancelBooking(bookingId: string, reason: string): boolean {
    const user = this.getCurrentUser();
    const booking = this.data.bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    const prop = this.data.properties.find(p => p.id === booking.propertyId);
    const isRenter = booking.renterId === user.id;
    const isOwner = prop?.ownerId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isRenter && !isOwner && !isAdmin) {
      throw new Error('Unauthorized to cancel this booking.');
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date().toISOString();
    booking.updatedAt = new Date().toISOString();

    const payment = this.data.payments.find(p => p.bookingId === bookingId);
    if (payment) {
      payment.status = 'refunded';
    }

    if (booking.bedId) {
      this.updateBedStatus(booking.bedId, 'available');
    }

    this.logAudit(
      user.id,
      user.name,
      user.role,
      'BOOKING_CANCELLED',
      'booking',
      bookingId,
      `Booking ${booking.bookingCode} cancelled by ${user.name}. Reason: ${reason}`
    );

    this.notify();
    return true;
  }

  public getBookingsForUser(userId: string): Booking[] {
    return this.data.bookings
      .filter(b => b.renterId === userId)
      .map(b => ({
        ...b,
        property: this.getPropertyById(b.propertyId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  public getBookingsForHost(hostId: string): Booking[] {
    const hostPropIds = new Set(
      this.data.properties.filter(p => p.ownerId === hostId).map(p => p.id)
    );
    return this.data.bookings
      .filter(b => hostPropIds.has(b.propertyId))
      .map(b => ({
        ...b,
        property: this.getPropertyById(b.propertyId),
        renter: this.data.users.find(u => u.id === b.renterId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  public getAllBookingsForAdmin(): Booking[] {
    return this.data.bookings
      .map(b => ({
        ...b,
        property: this.getPropertyById(b.propertyId),
        renter: this.data.users.find(u => u.id === b.renterId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // ===================== REVIEWS =====================

  public getReviewsForProperty(propertyId: string): Review[] {
    return this.data.reviews
      .filter(r => r.propertyId === propertyId)
      .map(r => ({
        ...r,
        renter: this.data.users.find(u => u.id === r.renterId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  public addReview(reviewData: {
    propertyId: string;
    bookingId?: string;
    applicationId?: string;
    rating: number;
    cleanlinessRating: number;
    accuracyRating: number;
    locationRating: number;
    communicationRating: number;
    comment: string;
  }): Review {
    const renter = this.getCurrentUser();

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      ...reviewData,
      renterId: renter.id,
      createdAt: new Date().toISOString(),
    };

    this.data.reviews.push(newRev);

    const prop = this.data.properties.find(p => p.id === reviewData.propertyId);
    if (prop) {
      const allPropReviews = this.data.reviews.filter(
        r => r.propertyId === prop.id
      );
      const avg =
        allPropReviews.reduce((sum, r) => sum + r.rating, 0) /
        allPropReviews.length;
      prop.rating = Number(avg.toFixed(2));
      prop.reviewsCount = allPropReviews.length;
    }

    this.logAudit(
      renter.id,
      renter.name,
      renter.role,
      'REVIEW_SUBMITTED',
      'property',
      reviewData.propertyId,
      `Submitted review with rating ${reviewData.rating}/5 for "${prop?.title}".`
    );

    this.notify();
    return newRev;
  }

  // ===================== FAVORITES =====================

  public getFavorites(): string[] {
    return [...this.data.favorites];
  }

  public toggleFavorite(propertyId: string): boolean {
    const idx = this.data.favorites.indexOf(propertyId);
    if (idx >= 0) {
      this.data.favorites.splice(idx, 1);
    } else {
      this.data.favorites.push(propertyId);
    }
    this.notify();
    return idx === -1;
  }

  public isFavorited(propertyId: string): boolean {
    return this.data.favorites.includes(propertyId);
  }

  // ===================== MESSAGING =====================

  public getConversationsForUser(userId: string): Conversation[] {
    return this.data.conversations
      .filter(c => c.renterId === userId || c.ownerId === userId)
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt || '').getTime() -
          new Date(a.lastMessageAt || '').getTime()
      );
  }

  public getMessagesForConversation(convId: string): Message[] {
    return this.data.messages
      .filter(m => m.conversationId === convId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }

  public sendMessage(conversationId: string, text: string): Message {
    const user = this.getCurrentUser();
    const conv = this.data.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      text,
      createdAt: new Date().toISOString(),
    };

    this.data.messages.push(msg);
    conv.lastMessage = text;
    conv.lastMessageAt = msg.createdAt;

    this.notify();
    return msg;
  }

  // ===================== PLATFORM SETTINGS & AUDIT =====================

  public getSettings(): PlatformSettings {
    return { ...this.data.settings };
  }

  public updateSettings(
    newSettings: Partial<PlatformSettings>
  ): PlatformSettings {
    const admin = this.getCurrentUser();
    if (admin.role !== 'admin') throw new Error('Unauthorized');

    this.data.settings = { ...this.data.settings, ...newSettings };
    this.logAudit(
      admin.id,
      admin.name,
      admin.role,
      'PLATFORM_SETTINGS_UPDATED',
      'platform_settings',
      'global',
      JSON.stringify(newSettings)
    );
    this.notify();
    return this.data.settings;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getCategories(): Category[] {
    return [...this.data.categories];
  }

  public getAmenities(): Amenity[] {
    return [...this.data.amenities];
  }

  private logAudit(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details: string
  ) {
    this.data.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
  }
}

export const store = new AppStore();
