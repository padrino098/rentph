import React, { useState } from 'react';
import { Property, Booking, Payment } from '../../types';
import { PricingEngine } from '../../services/pricingEngine';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { X, CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  checkIn: string;
  checkOut: string;
  guests: number;
  onSuccess: (booking: Booking, payment: Payment) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  property,
  checkIn,
  checkOut,
  guests,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'card' | 'aura_pay' | 'apple_pay'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('884');
  const [simulateFail, setSimulateFail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{ booking: Booking; payment: Payment } | null>(null);

  if (!isOpen) return null;

  const pricing = PricingEngine.calculate(
    property,
    checkIn,
    checkOut,
    guests,
    store.getSettings().serviceFeePercent
  );

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    // Simulate payment gateway latency (1.2s)
    await new Promise(r => setTimeout(r, 1200));

    if (simulateFail) {
      setIsProcessing(false);
      setErrorMessage('Payment declined by card issuer: Insufficient funds or invalid CVC. Booking not confirmed.');
      return;
    }

    try {
      const result = store.createBooking({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests,
        specialRequests: specialRequests.trim() || undefined,
        paymentMethod: {
          cardBrand: paymentProvider === 'aura_pay' ? 'Aura Express Pay' : 'Visa',
          cardLast4: '4242',
        },
      });

      setConfirmedBooking(result);
      setIsProcessing(false);
      onSuccess(result.booking, result.payment);
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Failed to finalize reservation';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 text-base">
            {confirmedBooking ? 'Reservation Confirmed' : 'Confirm and Pay'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-left space-y-6">
          {confirmedBooking ? (
            /* Confirmation Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-serif text-stone-900">
                You're heading to {property.city}!
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Reservation <span className="font-semibold text-stone-900">{confirmedBooking.booking.bookingCode}</span> is confirmed. A receipt and arrival instructions have been delivered to your RentPH inbox.
              </p>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-left max-w-md mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Dates:</span>
                  <span className="font-medium text-stone-900">{confirmedBooking.booking.checkIn} to {confirmedBooking.booking.checkOut} ({confirmedBooking.booking.nights} nights)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Guests:</span>
                  <span className="font-medium text-stone-900">{confirmedBooking.booking.guests} Guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Paid:</span>
                  <span className="font-semibold text-stone-900 tabular-nums">${confirmedBooking.payment.amount.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Host:</span>
                  <span className="font-medium text-stone-900">{property.owner?.name}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm cursor-pointer"
                >
                  View in My Trips
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handlePayAndConfirm} className="space-y-6">
              {/* Property summary card */}
              <div className="flex gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-stone-200">
                  <ImageWithFallback
                    src={property.images[0]?.imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-stone-900">{property.title}</h4>
                  <div className="text-[11px] text-stone-500">{property.city}, {property.country}</div>
                  <div className="text-[11px] text-stone-600 font-medium">
                    {checkIn} → {checkOut} ({pricing.nights} nights, {guests} guests)
                  </div>
                </div>
              </div>

              {/* Price Details */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-2 text-xs text-stone-600">
                <div className="font-semibold text-stone-900 pb-1 border-b border-stone-100">
                  Price Details
                </div>
                <div className="flex justify-between">
                  <span>${pricing.nightlyRate} × {pricing.nights} nights</span>
                  <span className="tabular-nums font-medium text-stone-900">${pricing.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cleaning fee</span>
                  <span className="tabular-nums font-medium text-stone-900">${pricing.cleaningFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>RentPH service fee</span>
                  <span className="tabular-nums font-medium text-stone-900">${pricing.serviceFee.toLocaleString()}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{pricing.discountDescription}</span>
                    <span className="tabular-nums">-${pricing.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 flex justify-between font-semibold text-sm text-stone-900 border-t border-stone-200">
                  <span>Total (USD)</span>
                  <span className="tabular-nums">${pricing.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Special requests for host (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Estimated time of arrival, dietary preferences, or quiet celebration details..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'rentph_pay', label: 'RentPH Pay' },
                    { id: 'apple_pay', label: 'Apple Pay' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentProvider(m.id as any)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        paymentProvider === m.id
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Card Fields */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-700 font-medium">
                    <span>Card Information</span>
                    <CreditCard className="w-4 h-4 text-stone-500" />
                  </div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="Card number"
                    className="w-full p-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      placeholder="MM / YY"
                      className="p-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="p-2 text-xs bg-white rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Developer / Tester Gateway Simulation Toggle */}
              <div className="p-3 bg-stone-100/80 rounded-xl flex items-center justify-between text-xs text-stone-600">
                <span className="text-[11px]">Simulate Payment Gateway Failure:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFail}
                    onChange={e => setSimulateFail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600" />
                </label>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing transaction with bank...</span>
                    </>
                  ) : (
                    <span>Pay ${pricing.total.toLocaleString()} and Confirm Booking</span>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>256-bit TLS encrypted transaction · RentPH Guarantee</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
