import React, { useState } from 'react';
import { RentalApplication, Property, ApplicationStatus } from '../../types';
import { store } from '../../services/store';
import { useAuth } from '../../context/AuthContext';
import { ApplicationStatusTracker } from '../common/ApplicationStatusTracker';
import {
  FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  Building, Calendar, Download, CreditCard, Sparkles, SlidersHorizontal
} from 'lucide-react';

interface ApplicationsViewProps {
  onSelectProperty: (property: Property) => void;
  onNavigateHome: () => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  onSelectProperty,
  onNavigateHome,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedPassApp, setSelectedPassApp] = useState<RentalApplication | null>(null);
  const [showSimulator, setShowSimulator] = useState(true);

  const applications = store.getApplicationsForUser(currentUser.id);

  const filtered = applications.filter(a => {
    if (activeTab === 'pending') return a.status === 'submitted' || a.status === 'under_review';
    if (activeTab === 'approved') return a.status === 'approved';
    if (activeTab === 'rejected') return a.status === 'rejected';
    return true;
  });

  const handleSimulateStatus = (appId: string, newStatus: ApplicationStatus, reason?: string) => {
    store.updateApplicationStatus(appId, newStatus, reason);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-slate-900">
            My Tenancy & Dorm Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track the status of your semester dorm applications with step-by-step verification progress indicators.
          </p>
        </div>

        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className={`self-start sm:self-auto px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            showSimulator
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
          title="Toggle interactive workflow tester"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{showSimulator ? 'Workflow Simulator Active' : 'Enable Workflow Simulator'}</span>
        </button>
      </div>

      {/* Interactive Workflow Explainer / Simulator Callout */}
      {showSimulator && (
        <div className="mb-6 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/90 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-950 font-bold">
            <SlidersHorizontal className="w-4 h-4 text-amber-700" />
            <span>Interactive Application Status Workflow Tester</span>
          </div>
          <p className="text-amber-900/80 leading-relaxed text-[11px]">
            RentPH's rental application workflow progresses through <strong>Submitted</strong> → <strong>Under Review</strong> → and resolves into <strong>Approved</strong> (unlocking the move-in pass) or <strong>Rejected</strong> (with landlord notes). Click any of the simulator badges on an application below to see the status tracker update its timeline, nodes, and action states in real time.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All (${applications.length})` },
          { id: 'pending', label: `Under Review (${applications.filter(a => a.status === 'submitted' || a.status === 'under_review').length})` },
          { id: 'approved', label: `Approved (${applications.filter(a => a.status === 'approved').length})` },
          { id: 'rejected', label: `Rejected (${applications.filter(a => a.status === 'rejected').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-semibold px-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No applications found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
            Browse verified dormitories and rental spaces near your university and submit an application.
          </p>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            Search Housing
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(app => {
            const property = store.getPropertyById(app.propertyId);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5"
              >
                {/* Header Information Row */}
                <div className="flex flex-col md:flex-row gap-4 items-start justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {app.applicationCode}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Submitted: {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3
                      onClick={() => property && onSelectProperty(property)}
                      className="font-serif text-lg font-semibold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      {app.propertyTitle}
                    </h3>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{app.roomNumber || 'Private Unit'}</span>
                      {app.bedLabel && <span> · {app.bedLabel}</span>}
                      <span> · {app.schoolOrCompany}</span>
                    </div>
                  </div>

                  {/* Financials & Quick Actions */}
                  <div className="text-left md:text-right flex flex-col md:items-end gap-2">
                    <div>
                      <div className="text-[11px] text-slate-500">Monthly Rent</div>
                      <div className="text-lg font-semibold text-slate-900 tabular-nums">
                        ₱{app.monthlyRent.toLocaleString()}
                        <span className="text-xs text-slate-500 font-normal"> / mo</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Refundable Deposit: ₱{app.securityDeposit.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {app.status === 'approved' && (
                        <button
                          onClick={() => setSelectedPassApp(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Move-in Pass</span>
                        </button>
                      )}

                      {property && (
                        <button
                          onClick={() => onSelectProperty(property)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          View Dorm
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* THE STATUS TRACKER COMPONENT */}
                <div>
                  <ApplicationStatusTracker
                    status={app.status}
                    createdAt={app.createdAt}
                    updatedAt={app.updatedAt}
                    rejectionReason={app.rejectionReason}
                    targetMoveInDate={app.targetMoveInDate}
                    applicantName={app.applicantName}
                    onAction={action => {
                      if (action === 'download_pass') {
                        setSelectedPassApp(app);
                      } else if (action === 'explore_alternatives') {
                        onNavigateHome();
                      } else if (action === 'contact_landlord') {
                        if (property) onSelectProperty(property);
                      }
                    }}
                  />
                </div>

                {/* Interactive Status Simulation Buttons */}
                {showSimulator && (
                  <div className="pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 p-3 rounded-xl">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Test workflow transitions:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleSimulateStatus(app.id, 'draft')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          app.status === 'draft'
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        0. Draft
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(app.id, 'submitted')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          app.status === 'submitted'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        1. Submitted
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(app.id, 'under_review')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          app.status === 'under_review'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        2. Under Review
                      </button>
                      <button
                        onClick={() => handleSimulateStatus(app.id, 'approved')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          app.status === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        3a. Approve
                      </button>
                      <button
                        onClick={() =>
                          handleSimulateStatus(
                            app.id,
                            'rejected',
                            'Room occupancy reached full semester capacity; please consider the 4th floor co-ed unit.'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          app.status === 'rejected'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        3b. Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official Move-in Pass Modal */}
      {selectedPassApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-base font-bold text-slate-900">Official Tenancy Move-in Pass</h3>
              </div>
              <button onClick={() => setSelectedPassApp(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-semibold text-center">
                TENANCY APPROVED & VERIFIED
              </div>

              <div>
                <span className="text-slate-500">Student / Tenant:</span>
                <div className="font-semibold text-sm text-slate-900">{selectedPassApp.applicantName}</div>
                <div className="text-slate-500 text-[11px]">{selectedPassApp.schoolOrCompany}</div>
              </div>

              <div>
                <span className="text-slate-500">Accommodation:</span>
                <div className="font-semibold text-slate-900">{selectedPassApp.propertyTitle}</div>
                <div className="text-slate-600 font-medium">{selectedPassApp.roomNumber} · {selectedPassApp.bedLabel}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500">Move-in Date:</span>
                  <div className="font-semibold text-slate-900">{selectedPassApp.targetMoveInDate}</div>
                </div>
                <div>
                  <span className="text-slate-500">Monthly Rent:</span>
                  <div className="font-semibold text-slate-900 tabular-nums">₱{selectedPassApp.monthlyRent.toLocaleString()}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Please present this pass along with your University ID upon arrival at the dorm front desk.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  alert('Move-in Pass printed / saved to wallet.');
                  setSelectedPassApp(null);
                }}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
              >
                Save / Print Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
