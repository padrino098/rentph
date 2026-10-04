import React, { useState } from 'react';
import { Property, DormRoom, DormBed, RentalApplication } from '../../types';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ApplicationStatusTracker } from '../common/ApplicationStatusTracker';
import {
  FileText, CheckCircle2, AlertCircle, X,
  Calendar, Shield, User, School as SchoolIcon, ArrowRight
} from 'lucide-react';

interface RentalApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess: (application: RentalApplication) => void;
}

export const RentalApplicationModal: React.FC<RentalApplicationModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const { currentUser } = useAuth();

  // Find all available beds
  const availableBedsList: { room: DormRoom; bed: DormBed }[] = [];
  property.rooms.forEach(room => {
    room.beds.forEach(bed => {
      if (bed.status === 'available') {
        availableBedsList.push({ room, bed });
      }
    });
  });

  const [selectedBedKey, setSelectedBedKey] = useState<string>(() => {
    if (availableBedsList.length > 0) {
      return `${availableBedsList[0].room.id}:${availableBedsList[0].bed.id}`;
    }
    return '';
  });

  const [targetMoveIn, setTargetMoveIn] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [durationMonths, setDurationMonths] = useState<number>(10); // Standard 10-mo school year
  const [schoolOrCompany, setSchoolOrCompany] = useState(
    currentUser.schoolName || 'University of Santo Tomas'
  );
  const [studentId, setStudentId] = useState('UST-2023-04981');
  const [guardianName, setGuardianName] = useState('Dr. Robert Jassal');
  const [guardianPhone, setGuardianPhone] = useState('+63 917 999 1234');
  const [message, setMessage] = useState(
    'I am an enrolled student seeking a quiet, verified study accommodation. All requirements and deposit ready upon approval.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<RentalApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Selected bed and room resolution
  let chosenRoomId: string | undefined;
  let chosenBedId: string | undefined;
  let effectiveRent = property.monthlyRent;

  if (selectedBedKey) {
    const [rId, bId] = selectedBedKey.split(':');
    chosenRoomId = rId;
    chosenBedId = bId;
    const room = property.rooms.find(r => r.id === rId);
    const bed = room?.beds.find(b => b.id === bId);
    if (bed) {
      effectiveRent = bed.monthlyRate;
    }
  }

  const initialDeposit = property.securityDeposit || effectiveRent;
  const initialTotalDueUponApproval = effectiveRent + initialDeposit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const app = store.submitRentalApplication({
        propertyId: property.id,
        roomId: chosenRoomId,
        bedId: chosenBedId,
        targetMoveInDate: targetMoveIn,
        intendedMonths: durationMonths,
        schoolOrCompany: schoolOrCompany.trim(),
        studentIdOrGovtId: studentId.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        messageToLandlord: message.trim(),
      });

      setSubmittedApp(app);
      setIsSubmitting(false);
      onSuccess(app);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit application');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="font-serif text-base font-semibold text-slate-900">
                {submittedApp ? 'Application Submitted' : 'Student & Tenant Rental Application'}
              </h3>
              <p className="text-xs text-slate-500">
                {property.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {submittedApp ? (
            /* Submission Success Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-xl text-slate-900">
                Application {submittedApp.applicationCode} Sent!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your lease application has been transmitted to landlord <span className="font-semibold text-slate-900">{property.owner?.name}</span> for tenancy review. You will be notified in your RentPH dashboard once approved.
              </p>

              {/* Live Application Status Tracker */}
              <div className="max-w-lg mx-auto text-left pt-2">
                <ApplicationStatusTracker
                  status={submittedApp.status}
                  createdAt={submittedApp.createdAt}
                  targetMoveInDate={submittedApp.targetMoveInDate}
                  variant="detailed"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left max-w-lg mx-auto text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Space:</span>
                  <span className="font-semibold text-slate-900">{submittedApp.roomNumber || 'Private Unit'} · {submittedApp.bedLabel || 'Full Space'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Move-in:</span>
                  <span className="font-medium text-slate-900">{submittedApp.targetMoveInDate} ({submittedApp.intendedMonths} months)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Rent:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₱{submittedApp.monthlyRent.toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₱{submittedApp.securityDeposit.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  View in My Applications
                </button>
              </div>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Property & Bed Selection */}
              {availableBedsList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Select Available Room & Bed
                  </label>
                  <select
                    value={selectedBedKey}
                    onChange={e => setSelectedBedKey(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    {availableBedsList.map(({ room, bed }) => (
                      <option key={`${room.id}:${bed.id}`} value={`${room.id}:${bed.id}`}>
                        {room.roomNumber} — {bed.bedLabel} (₱{bed.monthlyRate.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Move-in Date and Term */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Move-in Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={targetMoveIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setTargetMoveIn(e.target.value)}
                      required
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intended Lease Term
                  </label>
                  <select
                    value={durationMonths}
                    onChange={e => setDurationMonths(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
                  >
                    <option value={5}>1 Semester (5 Months)</option>
                    <option value={10}>Academic Year (10 Months)</option>
                    <option value={12}>1 Full Year (12 Months)</option>
                    <option value={2}>Short-term (2 Months)</option>
                  </select>
                </div>
              </div>

              {/* Applicant Verification Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <SchoolIcon className="w-4 h-4 text-slate-600" />
                  <span>Student & Tenant Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      School / College / Workplace
                    </label>
                    <input
                      type="text"
                      value={schoolOrCompany}
                      onChange={e => setSchoolOrCompany(e.target.value)}
                      placeholder="e.g. University of Santo Tomas"
                      required
                      className="w-full p-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Student ID / Government ID No.
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={e => setStudentId(e.target.value)}
                      placeholder="e.g. UST-2023-04981"
                      required
                      className="w-full p-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Guardian / Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      placeholder="Parent / Guardian Name"
                      required
                      className="w-full p-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Guardian Phone Number
                    </label>
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      placeholder="+63 917 000 0000"
                      required
                      className="w-full p-2 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Message to Landlord */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message / Introduction to Landlord
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Financial Breakdown upon Approval */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-900 pb-1 border-b border-slate-200">
                  Initial Payment Schedule (Upon Landlord Approval)
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>First Month Rent Advance:</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₱{effectiveRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Refundable Security Deposit (1 month):</span>
                  <span className="font-semibold text-slate-900 tabular-nums">₱{initialDeposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Est. Monthly Sub-metered Utility:</span>
                  <span className="font-medium text-slate-900 tabular-nums">≈ ₱{property.utilityEstimate.toLocaleString()}</span>
                </div>
                <div className="pt-2 flex justify-between font-semibold text-sm text-slate-900 border-t border-slate-200">
                  <span>Total Move-in Hold (PHP):</span>
                  <span className="tabular-nums">₱{initialTotalDueUponApproval.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Submit Rental Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Verified Landlord Lease Contract · Zero Advance Fee until Approved</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
