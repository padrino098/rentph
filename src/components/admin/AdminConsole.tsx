import React, { useState } from 'react';
import { Property, User, Booking, AuditLog, PlatformSettings, UserStatus, UserRole } from '../../types';
import { store } from '../../services/store';
import { formatPhp } from '../../services/currency';
import { useAuth } from '../../context/AuthContext';
import {
  Shield, Users,
  Home, DollarSign, Settings, FileText, Check, Ban, Eye
} from 'lucide-react';

interface AdminConsoleProps {
  onSelectProperty: (property: Property) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onSelectProperty }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'bookings' | 'settings' | 'audit'>('overview');

  // Settings form
  const [settings, setSettings] = useState<PlatformSettings>(store.getSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);

  const allProperties = store.getAllPropertiesForAdmin();
  const allUsers = store.getUsers();
  const allBookings = store.getAllBookingsForAdmin();
  const auditLogs = store.getAuditLogs();

  const totalGMV = allBookings
    .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total, 0);
  const platformRevenue = allBookings
    .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.serviceFee, 0);

  const handleToggleUserStatus = (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    store.updateUserStatus(userId, nextStatus, 'Admin quick status update');
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    store.updateUserRole(userId, newRole);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(settings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-stone-900" />
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">
              Platform Administration
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Global oversight, account access, platform configuration, and transaction integrity.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-200 mb-8">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: Home },
          { id: 'users', label: `Users & Roles (${allUsers.length})`, icon: Users },
          { id: 'bookings', label: `Bookings (${allBookings.length})`, icon: DollarSign },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
          { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-medium">Gross Marketplace Value (GMV)</div>
              <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums mt-1">
                {formatPhp(totalGMV)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Total stay volume</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-medium">Platform Fee Net Revenue</div>
              <div className="text-2xl font-serif font-semibold text-emerald-700 tabular-nums mt-1">
                {formatPhp(platformRevenue)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Based on {settings.serviceFeePercent}% service rate</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
                <div className="text-xs text-stone-500 font-medium">Total Properties</div>
              <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums mt-1">
                {allProperties.length}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">{allProperties.filter(p => p.status === 'approved').length} published active</div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="text-xs text-stone-500 font-medium">Registered Accounts</div>
              <div className="text-2xl font-serif font-semibold text-stone-900 tabular-nums mt-1">
                {allUsers.length}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">{allUsers.filter(u => u.status === 'active').length} in good standing</div>
            </div>
          </div>

          {/* Quick Snapshot */}
          <div className="grid grid-cols-1 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-stone-200">
              <h3 className="font-semibold text-sm text-stone-900 mb-3">Recent Platform Events</h3>
              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="text-xs border-b border-stone-100 pb-2">
                    <div className="flex items-center justify-between text-stone-400 text-[10px]">
                      <span className="font-semibold text-stone-700">{log.action}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-stone-800 text-[11px] mt-0.5">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-stone-900">Platform Users ({allUsers.length})</h3>
            <span className="text-[11px] text-stone-400">Manage account access, roles, and status</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3.5 font-medium text-stone-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center font-serif text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3.5 text-stone-600">{u.email}</td>
                    <td className="p-3.5">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs p-1 border rounded bg-white font-medium capitalize"
                      >
                        <option value="guest">Guest</option>
                        <option value="host">Host</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        u.status === 'suspended' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                            u.status === 'active'
                              ? 'border border-amber-300 text-amber-800 hover:bg-amber-50'
                              : 'border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Sanctuary</th>
                  <th className="p-3.5">Renter</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5">Total (Fee)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {allBookings.map(b => (
                  <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-stone-900">{b.bookingCode}</td>
                    <td className="p-3.5 font-medium text-stone-900 max-w-xs truncate">{b.property?.title}</td>
                    <td className="p-3.5 text-stone-700">{b.renter?.name}</td>
                    <td className="p-3.5 text-stone-600">{b.checkIn} → {b.checkOut}</td>
                    <td className="p-3.5 font-medium text-stone-900 tabular-nums">
                      {formatPhp(b.total)} <span className="text-stone-400 text-[11px]">({formatPhp(b.serviceFee)})</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                        b.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            if (confirm(`Force cancel booking ${b.bookingCode} and issue refund?`)) {
                              store.cancelBooking(b.id, 'Cancelled by Platform Administrator (Dispute Resolution)');
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          Dispute Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <h3 className="font-serif text-lg text-stone-900 mb-4">Platform Fee & Booking Config</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Platform Service Fee Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.serviceFeePercent}
                onChange={e => setSettings({ ...settings, serviceFeePercent: Number(e.target.value) })}
                className="w-full p-2.5 text-xs border rounded-xl"
              />
              <p className="text-[11px] text-stone-400 mt-1">Commission deducted from guests and added to platform earnings.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pending Reservation Expiry (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.pendingExpirationMinutes}
                onChange={e => setSettings({ ...settings, pendingExpirationMinutes: Number(e.target.value) })}
                className="w-full p-2.5 text-xs border rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Platform Base Currency
              </label>
              <input
                type="text"
                value={settings.platformCurrency}
                onChange={e => setSettings({ ...settings, platformCurrency: e.target.value })}
                className="w-full p-2.5 text-xs border rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {settingsSaved ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Settings updated successfully
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 cursor-pointer"
              >
                Save Global Config
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-stone-900">Immutable Audit Trail ({auditLogs.length} Events)</h3>
            <span className="text-[11px] text-stone-400">Strict chronological record for compliance and disputes</span>
          </div>

          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/60 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs font-semibold text-stone-900">{log.userName}</span>
                    <span className="text-[10px] text-stone-400 capitalize">({log.userRole})</span>
                  </div>
                  <p className="text-xs text-stone-600">{log.details}</p>
                </div>
                <div className="text-[11px] text-stone-400 shrink-0 tabular-nums">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
