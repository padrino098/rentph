import { Property, Booking, BlockedDate } from '../types';

export interface AvailabilityResult {
  available: boolean;
  error?: string;
  conflictingBookingId?: string;
  conflictingBlockedDateId?: string;
}

export class AvailabilityEngine {
  /**
   * Helper to check if two date intervals [startA, endA) and [startB, endB) overlap.
   * Check-out date can match check-in date of the next guest (standard hotel/rental logic).
   */
  public static doIntervalsOverlap(
    startAStr: string,
    endAStr: string,
    startBStr: string,
    endBStr: string
  ): boolean {
    const startA = new Date(startAStr).getTime();
    const endA = new Date(endAStr).getTime();
    const startB = new Date(startBStr).getTime();
    const endB = new Date(endBStr).getTime();

    // Overlap condition: startA < endB && endA > startB
    return startA < endB && endA > startB;
  }

  /**
   * Checks full availability for a property on requested dates and guest count.
   */
  public static verifyAvailability(
    property: Property | undefined,
    checkIn: string,
    checkOut: string,
    guests: number,
    existingBookings: Booking[],
    blockedDates: BlockedDate[],
    ignoreBookingId?: string
  ): AvailabilityResult {
    // 1. Verify property exists
    if (!property) {
      return { available: false, error: 'Property not found in database.' };
    }

    // 2. Verify property status is approved
    if (property.status !== 'approved') {
      return { available: false, error: `Property is not available for bookings (Current status: ${property.status}).` };
    }

    // 3. Verify check-in is before check-out
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    if (isNaN(checkInTime) || isNaN(checkOutTime)) {
      return { available: false, error: 'Invalid dates provided.' };
    }

    if (checkInTime >= checkOutTime) {
      return { available: false, error: 'Check-out date must be strictly after check-in date.' };
    }

    // Verify dates are not in the distant past (e.g. today or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Allow today and future
    if (checkInTime < today.getTime() - 24 * 60 * 60 * 1000) {
      return { available: false, error: 'Check-in date cannot be in the past.' };
    }

    // 4. Verify guest count does not exceed max_guests
    if (guests <= 0) {
      return { available: false, error: 'Guest count must be at least 1.' };
    }
    if (guests > property.maxGuests) {
      return { available: false, error: `Guest count (${guests}) exceeds maximum capacity for this property (${property.maxGuests} guests).` };
    }

    // 5. Check existing pending/confirmed bookings for this property
    const activeBookings = existingBookings.filter(b => 
      b.propertyId === property.id &&
      b.id !== ignoreBookingId &&
      (b.status === 'confirmed' || b.status === 'pending')
    );

    for (const booking of activeBookings) {
      if (this.doIntervalsOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut)) {
        return {
          available: false,
          error: `Selected dates (${checkIn} to ${checkOut}) conflict with an existing reservation.`,
          conflictingBookingId: booking.id,
        };
      }
    }

    // 6. Check host blocked dates
    const propertyBlocked = blockedDates.filter(b => b.propertyId === property.id);
    for (const blocked of propertyBlocked) {
      if (this.doIntervalsOverlap(checkIn, checkOut, blocked.startDate, blocked.endDate)) {
        return {
          available: false,
          error: `Selected dates conflict with host blocked dates (${blocked.reason.replace('_', ' ')}).`,
          conflictingBlockedDateId: blocked.id,
        };
      }
    }

    return { available: true };
  }

  /**
   * Helper to check if a specific date (YYYY-MM-DD) is booked or blocked
   */
  public static isDateUnavailable(
    propertyId: string,
    dateStr: string,
    existingBookings: Booking[],
    blockedDates: BlockedDate[]
  ): boolean {
    const target = new Date(dateStr).getTime();

    // Check bookings
    const booked = existingBookings.some(b => {
      if (b.propertyId !== propertyId || (b.status !== 'confirmed' && b.status !== 'pending')) return false;
      const bStart = new Date(b.checkIn).getTime();
      const bEnd = new Date(b.checkOut).getTime();
      return target >= bStart && target < bEnd;
    });
    if (booked) return true;

    // Check blocked dates
    const blocked = blockedDates.some(bl => {
      if (bl.propertyId !== propertyId) return false;
      const blStart = new Date(bl.startDate).getTime();
      const blEnd = new Date(bl.endDate).getTime();
      return target >= blStart && target <= blEnd;
    });

    return blocked;
  }
}
