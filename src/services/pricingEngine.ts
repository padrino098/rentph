import { Property, PricingCalculation } from '../types';

export class PricingEngine {
  /**
   * Calculates itemized pricing for a stay.
   * All calculations strictly enforced on backend/engine.
   */
  public static calculate(
    property: Property,
    checkInDateStr: string,
    checkOutDateStr: string,
    guestsCount: number,
    serviceFeePercent: number = 12
  ): PricingCalculation {
    const checkIn = new Date(checkInDateStr);
    const checkOut = new Date(checkOutDateStr);

    // Difference in nights
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    const nightlyRate = property.pricePerNight ?? property.dailyRent ?? Math.round(property.monthlyRent / 30);
    const subtotal = nightlyRate * nights;

    // Discount tiers
    let discount = 0;
    let discountDescription = '';

    if (nights >= 28) {
      discount = Math.round(subtotal * 0.20);
      discountDescription = 'Monthly Stay Discount (20% off)';
    } else if (nights >= 7) {
      discount = Math.round(subtotal * 0.10);
      discountDescription = 'Weekly Extended Stay (10% off)';
    }

    const cleaningFee = property.cleaningFee;
    const effectiveFeePercent = property.serviceFeePercent ?? serviceFeePercent;
    const serviceFee = Math.round(subtotal * (effectiveFeePercent / 100));

    const total = subtotal + cleaningFee + serviceFee - discount;

    return {
      nights,
      nightlyRate,
      subtotal,
      cleaningFee,
      serviceFee,
      discount,
      discountDescription,
      total,
    };
  }
}
