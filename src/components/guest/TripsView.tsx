import React, { useState } from 'react';
import { Booking, Property } from '../../types';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { Calendar, MapPin, AlertCircle, Star, X, Check } from 'lucide-react';

interface TripsViewProps {
  onSelectProperty: (property: Property) => void;
  onNavigateHome: () => void;
}

export const TripsView: React.FC<TripsViewProps> = ({ onSelectProperty, onNavigateHome }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Review modal form state
  const [overallRating, setOverallRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [location, setLocation] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const bookings = store.getBookingsForUser(currentUser.id);

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') return b.status === 'confirmed';
    if (activeTab === 'completed') return b.status === 'completed';
    if (activeTab === 'cancelled') return b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  const handleCancelBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBookingId) return;

    try {
      store.cancelBooking(cancellingBookingId, cancelReason || 'Guest requested cancellation');
      setCancellingBookingId(null);
      setCancelReason('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !comment.trim()) return;

    try {
      store.addReview({
        bookingId: reviewBooking.id,
        propertyId: reviewBooking.propertyId,
        rating: overallRating,
        cleanlinessRating: cleanliness,
        accuracyRating: accuracy,
        locationRating: location,
        communicationRating: communication,
        comment: comment.trim(),
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewBooking(null);
        setReviewSuccess(false);
        setComment('');
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
          Your Trips & Reservations
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review upcoming check-ins, manage booked dates, and leave reviews for completed stays.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 mb-6">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Past Stays' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-medium px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-stone-900">No {activeTab} trips found</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Discover breathtaking sanctuaries and book your next getaway.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Explore Sanctuaries
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row gap-5 items-start justify-between"
            >
              {/* Left info */}
              <div className="flex gap-4">
                <div
                  onClick={() => b.property && onSelectProperty(b.property)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 shrink-0 cursor-pointer"
                >
                  <ImageWithFallback
                    src={b.property?.images[0]?.imageUrl}
                    alt={b.property?.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                      {b.bookingCode}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold tracking-wider ${
                      b.status === 'confirmed' ? 'text-emerald-700' :
                      b.status === 'completed' ? 'text-blue-700' : 'text-stone-400'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <h3
                    onClick={() => b.property && onSelectProperty(b.property)}
                    className="font-serif font-semibold text-sm sm:text-base text-stone-900 hover:text-stone-600 transition-colors cursor-pointer"
                  >
                    {b.property?.title || 'Sanctuary Stay'}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{b.property?.city}, {b.property?.country}</span>
                  </div>

                  <div className="text-xs text-stone-700 pt-1">
                    <span className="font-medium">{b.checkIn}</span> to <span className="font-medium">{b.checkOut}</span> ({b.nights} nights · {b.guests} guests)
                  </div>
                </div>
              </div>

              {/* Right actions & price */}
              <div className="flex flex-col md:items-end justify-between self-stretch pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                <div className="text-left md:text-right">
                  <div className="text-[11px] text-stone-500">Total Paid</div>
                  <div className="text-base font-semibold text-stone-900 tabular-nums">
                    ${b.total.toLocaleString()} USD
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => setCancellingBookingId(b.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel Reservation
                    </button>
                  )}

                  {b.status === 'completed' && (
                    <button
                      onClick={() => setReviewBooking(b)}
                      className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>Review Stay</span>
                    </button>
                  )}

                  {b.property && (
                    <button
                      onClick={() => onSelectProperty(b.property!)}
                      className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      View Property
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-semibold text-stone-900 text-sm">Cancel Reservation</h3>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              Are you sure you want to cancel this booking? The host will be notified and your dates will be released.
            </p>
            <form onSubmit={handleCancelBooking} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Change of schedule, flight delay..."
                  rows={3}
                  required
                  className="w-full p-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancellingBookingId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg text-stone-900">Review Your Stay</h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center text-emerald-700 space-y-2">
                <Check className="w-8 h-8 mx-auto" />
                <div className="font-semibold text-sm">Review published!</div>
                <div className="text-xs text-stone-500">Thank you for sharing your experience.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* 4 Ratings */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block">Cleanliness</label>
                    <select
                      value={cleanliness}
                      onChange={e => setCleanliness(Number(e.target.value))}
                      className="text-xs p-1 mt-1 border rounded w-full bg-white"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block">Accuracy</label>
                    <select
                      value={accuracy}
                      onChange={e => setAccuracy(Number(e.target.value))}
                      className="text-xs p-1 mt-1 border rounded w-full bg-white"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block">Location</label>
                    <select
                      value={location}
                      onChange={e => setLocation(Number(e.target.value))}
                      className="text-xs p-1 mt-1 border rounded w-full bg-white"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block">Communication</label>
                    <select
                      value={communication}
                      onChange={e => setCommunication(Number(e.target.value))}
                      className="text-xs p-1 mt-1 border rounded w-full bg-white"
                    >
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your public review
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe the architectural atmosphere, cleanliness, host hospitality, and neighborhood highlights..."
                    rows={4}
                    required
                    className="w-full p-2.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewBooking(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800"
                  >
                    Submit Verified Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
