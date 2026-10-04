import React from 'react';
import { ApplicationStatus } from '../../types';
import {
  FileEdit,
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Check,
  Clock,
  Key,
  AlertCircle,
  Calendar,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export type ApplicationWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | ApplicationStatus;

export interface ApplicationStatusTrackerProps {
  /** Current workflow status of the rental application */
  status: ApplicationWorkflowStatus;
  /** Optional creation timestamp (ISO string or formatted date) */
  createdAt?: string;
  /** Optional last update timestamp (ISO string or formatted date) */
  updatedAt?: string;
  /** Reason provided by landlord if application was rejected */
  rejectionReason?: string;
  /** Target move-in date to display */
  targetMoveInDate?: string;
  /** Applicant full name */
  applicantName?: string;
  /** Landlord or dormitory name */
  landlordName?: string;
  /** Whether to show descriptions beneath step labels (default: true) */
  showDescriptions?: boolean;
  /** Whether to show the bottom contextual status banner (default: true) */
  showBanner?: boolean;
  /** Display variant: 'default' | 'detailed' | 'compact' | 'minimal' */
  variant?: 'default' | 'detailed' | 'compact' | 'minimal';
  /** Additional CSS classes */
  className?: string;
  /** Optional callback when user clicks a primary action */
  onAction?: (action: 'download_pass' | 'contact_landlord' | 'explore_alternatives') => void;
}

interface StepItem {
  id: 'draft' | 'submitted' | 'under_review' | 'final';
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
}

export const ApplicationStatusTracker: React.FC<ApplicationStatusTrackerProps> = ({
  status,
  createdAt,
  updatedAt,
  rejectionReason,
  targetMoveInDate,
  applicantName,
  landlordName,
  showDescriptions = true,
  showBanner = true,
  variant = 'default',
  className = '',
  onAction,
}) => {
  const isDraft = status === 'draft';
  const isSubmitted = status === 'submitted';
  const isUnderReview = status === 'under_review';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  // Determine active step index (0: draft, 1: submitted, 2: under_review, 3: approved/rejected)
  const getActiveStepIndex = (): number => {
    switch (status) {
      case 'draft':
        return 0;
      case 'submitted':
        return 1;
      case 'under_review':
        return 2;
      case 'approved':
      case 'rejected':
      default:
        return 3;
    }
  };

  const activeIndex = getActiveStepIndex();

  // Progress percentage for the horizontal fill bar:
  // 4 steps => 0% at step 0, 33.3% at step 1, 66.6% at step 2, 100% at step 3
  const progressPercent = Math.min(100, Math.max(0, (activeIndex / 3) * 100));

  // Definition of the 4 horizontal steps
  const steps: StepItem[] = [
    {
      id: 'draft',
      label: 'Draft Application',
      shortLabel: 'Draft',
      description: 'Tenancy details & ID attached',
      icon: FileEdit,
    },
    {
      id: 'submitted',
      label: 'Submitted',
      shortLabel: 'Submitted',
      description: 'Delivered to landlord portal',
      icon: FileCheck,
    },
    {
      id: 'under_review',
      label: 'Under Review',
      shortLabel: 'Review',
      description: 'Ocular inspection & background check',
      icon: Search,
    },
    {
      id: 'final',
      label: isRejected ? 'Rejected' : isApproved ? 'Approved' : 'Decision Pending',
      shortLabel: isRejected ? 'Rejected' : isApproved ? 'Approved' : 'Decision',
      description: isRejected
        ? rejectionReason || 'Application was not approved'
        : isApproved
        ? 'Lease approved · Move-in pass issued'
        : 'Final landlord acceptance',
      icon: isRejected ? XCircle : isApproved ? CheckCircle2 : Key,
    },
  ];

  // Helper to determine state styling for each node
  const getNodeState = (index: number) => {
    if (isRejected && index === 3) {
      return 'rejected';
    }
    if (index < activeIndex) {
      return 'completed';
    }
    if (index === activeIndex) {
      return isRejected ? 'rejected' : isApproved ? 'completed' : 'current';
    }
    return 'upcoming';
  };

  // Compact variant for dense dashboard cards
  if (variant === 'compact') {
    return (
      <div className={`bg-slate-50/90 rounded-xl p-3 border border-slate-200 ${className}`}>
        {/* Header pill */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-800">Workflow Status</span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isRejected
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : isUnderReview
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isSubmitted
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
            {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
            {isUnderReview && <Clock className="w-3 h-3 text-amber-600" />}
            {isSubmitted && <FileCheck className="w-3 h-3 text-blue-600" />}
            {isDraft && <FileEdit className="w-3 h-3 text-slate-500" />}
            <span>{status.replace('_', ' ')}</span>
          </span>
        </div>

        {/* Horizontal Mini Track */}
        <div className="relative mb-2 px-1">
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full" />
          <div
            className={`absolute left-2 top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-500 ${
              isRejected ? 'bg-rose-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `calc(${progressPercent}% - 8px)` }}
          />

          <div className="relative flex items-center justify-between z-10">
            {steps.map((step, idx) => {
              const nodeState = getNodeState(idx);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      nodeState === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : nodeState === 'current'
                        ? 'bg-amber-500 text-white ring-2 ring-amber-200 animate-pulse'
                        : nodeState === 'rejected'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                        : 'bg-slate-200 text-slate-500 border border-white'
                    }`}
                  >
                    {nodeState === 'completed' ? (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    ) : nodeState === 'rejected' ? (
                      <XCircle className="w-2.5 h-2.5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-[9px] mt-1 truncate max-w-[65px] ${
                      nodeState === 'current'
                        ? 'font-bold text-amber-900'
                        : nodeState === 'rejected'
                        ? 'font-bold text-rose-900'
                        : nodeState === 'completed'
                        ? 'font-medium text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Minimal variant: Just horizontal progress line with step circles and labels
  if (variant === 'minimal') {
    return (
      <div className={`w-full ${className}`}>
        <div className="relative">
          {/* Background Track */}
          <div className="absolute left-6 right-6 top-4 h-1 bg-slate-200 -z-0">
            <div
              className={`h-full transition-all duration-500 ${
                isRejected ? 'bg-rose-500' : isApproved ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
            {steps.map((step, idx) => {
              const nodeState = getNodeState(idx);
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      nodeState === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : nodeState === 'current'
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs animate-pulse'
                        : nodeState === 'rejected'
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100 shadow-xs'
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }`}
                  >
                    {nodeState === 'completed' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-semibold ${
                      nodeState === 'current'
                        ? 'text-amber-900'
                        : nodeState === 'rejected'
                        ? 'text-rose-900'
                        : nodeState === 'completed'
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Default Variant: Full Production Horizontal Progress Bar with Step Labels & Active State Styling
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs text-left ${className}`}>
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-serif text-base font-semibold text-slate-900">
              Rental Application Workflow
            </h4>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : isUnderReview
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : isSubmitted
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
              {isUnderReview && <Clock className="w-3 h-3 text-amber-600 animate-spin" />}
              {isSubmitted && <FileCheck className="w-3 h-3 text-blue-600" />}
              {isDraft && <FileEdit className="w-3 h-3 text-slate-500" />}
              <span>{status.replace('_', ' ')}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            Stage {activeIndex + 1} of 4 · Verified RentPH tenancy review process
          </p>
        </div>

        {targetMoveInDate && (
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Target Move-in: <strong className="text-slate-900">{targetMoveInDate}</strong>
            </span>
          </div>
        )}
      </div>

      {/* HORIZONTAL PROGRESS BAR WITH STEP LABELS */}
      <div className="py-7">
        <div className="relative">
          {/* Horizontal Background Track (Desktop & Tablet) */}
          <div className="hidden sm:block absolute left-10 right-10 top-5 h-1.5 bg-slate-100 rounded-full overflow-hidden -z-0">
            <div
              className={`h-full transition-all duration-700 ease-in-out ${
                isRejected
                  ? 'bg-rose-500'
                  : isApproved
                  ? 'bg-emerald-500'
                  : activeIndex === 2
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative z-10">
            {steps.map((step, idx) => {
              const nodeState = getNodeState(idx);
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 sm:gap-2 group"
                >
                  {/* Step Bubble Icon with Active State Styling */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      nodeState === 'completed'
                        ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50'
                        : nodeState === 'current'
                        ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 ring-offset-1 animate-pulse'
                        : nodeState === 'rejected'
                        ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-100 ring-offset-1'
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }`}
                  >
                    {nodeState === 'completed' ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : nodeState === 'rejected' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Label & Details */}
                  <div className="flex-1">
                    <div className="flex items-center sm:justify-center gap-1.5">
                      <span
                        className={`text-xs ${
                          nodeState === 'current'
                            ? 'font-bold text-amber-950 underline decoration-amber-400 decoration-2 underline-offset-4'
                            : nodeState === 'rejected'
                            ? 'font-bold text-rose-950'
                            : nodeState === 'completed'
                            ? 'font-semibold text-slate-900'
                            : 'font-medium text-slate-400'
                        }`}
                      >
                        {idx + 1}. {step.label}
                      </span>

                      {nodeState === 'completed' && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      )}
                    </div>

                    {showDescriptions && (
                      <p
                        className={`text-[11px] mt-1 leading-snug ${
                          nodeState === 'current'
                            ? 'text-amber-800 font-medium'
                            : nodeState === 'rejected'
                            ? 'text-rose-700'
                            : nodeState === 'completed'
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DYNAMIC CONTEXTUAL STATUS BANNER */}
      {showBanner && (
        <div className="mt-1 pt-4 border-t border-slate-100">
          {/* Stage 1: Draft */}
          {isDraft && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <FileEdit className="w-4 h-4 text-slate-500" />
                <span>
                  Application is in draft form. Review your information and submit to notify the landlord.
                </span>
              </div>
            </div>
          )}

          {/* Stage 2: Submitted */}
          {isSubmitted && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-blue-950 text-sm">
                  Application Submitted to Landlord
                </span>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Your tenant dossier and requirements have been delivered to{' '}
                  <strong className="text-blue-950">{landlordName || 'the property owner'}</strong>. The landlord typically begins review within 24 hours. No booking fee or deposit is taken during this stage.
                </p>
              </div>
            </div>
          )}

          {/* Stage 3: Under Review */}
          {isUnderReview && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                  <Search className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-950 text-sm">
                    Landlord Tenancy Review in Progress
                  </span>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Your student verification and move-in timeline are being verified against room capacity. You may receive an ocular inspection invitation.
                  </p>
                </div>
              </div>

              {onAction && (
                <button
                  onClick={() => onAction('contact_landlord')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Message Landlord</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Stage 4a: Approved */}
          {isApproved && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 text-sm">
                    Application Approved · Move-in Pass Ready
                  </span>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Your room and bed space have been officially reserved. Present your Move-in Pass to dorm reception upon arrival.
                  </p>
                </div>
              </div>

              {onAction && (
                <button
                  onClick={() => onAction('download_pass')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <span>View Move-in Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Stage 4b: Rejected */}
          {isRejected && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-rose-950 text-sm">
                    Application Declined
                  </span>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    <strong>Reason:</strong>{' '}
                    {rejectionReason || 'Room occupancy reached capacity for the requested term.'}
                  </p>
                </div>
              </div>

              {onAction && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onAction('explore_alternatives')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Browse Similar Dorms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
