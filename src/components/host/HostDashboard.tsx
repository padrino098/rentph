import React, { useState } from 'react';
import { Property, Booking, RentalApplication } from '../../types';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { PropertyWizardModal } from './PropertyWizardModal';
import { BlockDatesModal } from './BlockDatesModal';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ApplicationStatusTracker } from '../common/ApplicationStatusTracker';
import {
  Plus, Calendar, DollarSign, Home, Star, Edit3,
  CheckCircle2, Clock, AlertTriangle, Eye, Shield, FileText, UserCheck, XCircle
} from 'lucide-react';

interface HostDashboardProps {
  onSelectProperty: (property: Property) => void;
  onOpenMessages: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ onSelectProperty, onOpenMessages }) => {
  const { currentUser } = useAuth();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [blockingProperty, setBlockingProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'listings' | 'reservations' | 'applications'>('listings');

  const properties = store.getHostProperties(currentUser.id);
  const applications = store.getApplicationsForHost(currentUser.id);
  const bookings = store.getBookingsForHost(currentUser.id);

  // Compute host statistics
  const totalEarnings = bookings
    .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.total - b.serviceFee), 0);

  const activeCount = properties.filter(p => p.status === 'approved').length;
  const pendingCount = properties.filter(p => p.status === 'pending').length;

  const handleEdit = (prop: Property) => {
    setEditingProperty(prop);
    setIsWizardOpen(true);
  };

  const handleCreateNew = () => {
    setEditingProperty(null);
    setIsWizardOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
            Host Operations & Portfolio
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Logged in as <span className="font-semibold text-stone-900">{currentUser.name}</span> · Manage architectural listings, availability, and guest reservations.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Sanctuary</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Net Host Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
            ${totalEarnings.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Direct payouts deposited</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Active Sanctuaries</span>
            <Home className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
            {activeCount}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {pendingCount > 0 ? `${pendingCount} pending admin review` : 'All curated and live'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Confirmed Bookings</span>
            <Calendar className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
            {bookings.length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Total reservations hosted</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-medium">Superhost Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums">
            4.96
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Top 1% architectural hospitality</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-stone-200 mb-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-xs font-medium px-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'listings'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          My Sanctuaries ({properties.length})
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-xs font-medium px-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reservations'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Guest Reservations ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-xs font-medium px-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'applications'
              ? 'border-stone-900 text-stone-900 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Tenant Applications ({applications.length})
        </button>
      </div>

      {/* TAB 1: LISTINGS */}
      {activeTab === 'listings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => {
            const cover = p.images[0]?.imageUrl || '';
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 bg-stone-100 overflow-hidden">
                    <ImageWithFallback
                      src={cover}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      {p.status === 'approved' && (
                        <span className="px-2 py-1 rounded-md bg-emerald-950/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Live & Approved</span>
                        </span>
                      )}
                      {p.status === 'pending' && (
                        <span className="px-2 py-1 rounded-md bg-amber-950/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Awaiting Admin Audit</span>
                        </span>
                      )}
                      {p.status === 'draft' && (
                        <span className="px-2 py-1 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-medium">
                          Incomplete Draft
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span className="px-2 py-1 rounded-md bg-red-950/80 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>Needs Revision</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="font-semibold text-stone-900 text-sm truncate">{p.title}</h3>
                    <p className="text-xs text-stone-500">{p.city}, {p.country}</p>
                    <div className="flex items-center gap-1 text-xs text-stone-400 pt-1">
                      <span>{p.bedrooms} beds</span>
                      <span>·</span>
                      <span>{p.bathrooms} baths</span>
                      <span>·</span>
                      <span>₱{p.monthlyRent?.toLocaleString()}/mo</span>
                    </div>

                    {p.rejectionReason && (
                      <div className="p-2 bg-red-50 text-red-700 text-[11px] rounded-lg mt-2">
                        Note: {p.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-stone-100 flex items-center justify-between gap-2 bg-stone-50/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Edit property in 10-step wizard"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setBlockingProperty(p)}
                      className="p-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Block dates for maintenance or owner stay"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Calendar</span>
                    </button>
                  </div>

                  {p.status === 'approved' && (
                    <button
                      onClick={() => onSelectProperty(p)}
                      className="text-xs text-stone-600 hover:text-stone-950 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No reservations recorded yet for your properties.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Booking</th>
                    <th className="p-3.5">Sanctuary</th>
                    <th className="p-3.5">Guest</th>
                    <th className="p-3.5">Dates</th>
                    <th className="p-3.5">Payout</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-stone-900">{b.bookingCode}</td>
                      <td className="p-3.5 font-medium text-stone-900 max-w-xs truncate">{b.property?.title}</td>
                      <td className="p-3.5 text-stone-700">{b.renter?.name || 'Verified Guest'}</td>
                      <td className="p-3.5 text-stone-600">
                        {b.checkIn} → {b.checkOut} ({b.nights}n)
                      </td>
                      <td className="p-3.5 font-semibold text-stone-900 tabular-nums">
                        ${(b.total - b.serviceFee).toLocaleString()} USD
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          b.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-500'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={onOpenMessages}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                        >
                          Message
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TENANT & DORM APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
              <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-stone-900">No applications received yet</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Incoming student and tenant lease applications for your properties will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => {
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {app.applicationCode}
                          </span>
                          <span className="font-semibold text-xs text-stone-900">
                            {app.applicantName}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            ({app.schoolOrCompany})
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">
                          Applying for <strong>{app.propertyTitle}</strong> · {app.roomNumber || 'Room'} · {app.bedLabel || 'Bed space'}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-xs font-semibold text-stone-900 tabular-nums">
                          ₱{app.monthlyRent.toLocaleString()} / mo
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Move-in: {app.targetMoveInDate} ({app.intendedMonths} mos)
                        </div>
                      </div>
                    </div>

                    {/* Integrated Status Tracker */}
                    <ApplicationStatusTracker
                      status={app.status}
                      createdAt={app.createdAt}
                      updatedAt={app.updatedAt}
                      rejectionReason={app.rejectionReason}
                      targetMoveInDate={app.targetMoveInDate}
                      applicantName={app.applicantName}
                      variant="compact"
                    />

                    {/* Landlord Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-stone-500">
                        Applicant contact: <span className="font-medium text-stone-800">{app.applicantPhone}</span> · Guardian: {app.guardianName || 'N/A'} ({app.guardianPhone || 'N/A'})
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === 'submitted' && (
                          <button
                            onClick={() => store.updateApplicationStatus(app.id, 'under_review')}
                            className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Mark Under Review
                          </button>
                        )}

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => store.updateApplicationStatus(app.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            Approve Lease
                          </button>
                        )}

                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for declining application:', 'Room fully booked for the semester.');
                              if (reason) store.updateApplicationStatus(app.id, 'rejected', reason);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Multi-step 10-step Property Creation Wizard */}
      <PropertyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => setIsWizardOpen(false)}
        initialProperty={editingProperty}
      />

      {/* Date Blocking Modal */}
      {blockingProperty && (
        <BlockDatesModal
          isOpen={Boolean(blockingProperty)}
          onClose={() => setBlockingProperty(null)}
          property={blockingProperty}
        />
      )}
    </div>
  );
};
