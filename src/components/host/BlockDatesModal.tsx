import React, { useState } from 'react';
import { Property, BlockedDate } from '../../types';
import { store } from '../../services/store';
import { X, Calendar, Trash2, Plus } from 'lucide-react';

interface BlockDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export const BlockDatesModal: React.FC<BlockDatesModalProps> = ({
  isOpen,
  onClose,
  property,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState<BlockedDate['reason']>('maintenance');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const blockedDates = store.getBlockedDates(property.id);

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (startDate >= endDate) {
      setError('End date must be after start date.');
      return;
    }

    try {
      store.blockHostDates(property.id, startDate, endDate, reason);
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemove = (id: string) => {
    store.unblockHostDates(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">Manage Blocked Dates</h3>
            <p className="text-[11px] text-stone-500 truncate max-w-xs">{property.title}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Blocks List */}
        <div className="py-4">
          <div className="text-xs font-semibold text-stone-700 mb-2">Current Blocked Windows</div>
          {blockedDates.length === 0 ? (
            <div className="p-3 bg-stone-50 rounded-xl text-stone-400 text-xs text-center">
              No dates currently blocked for this property.
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {blockedDates.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">{b.startDate}</span> to <span className="font-semibold text-stone-900">{b.endDate}</span>
                    <span className="ml-2 text-[10px] text-stone-500 capitalize bg-stone-200 px-1.5 py-0.5 rounded">
                      {b.reason.replace('_', ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="text-stone-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Block Form */}
        <form onSubmit={handleAddBlock} className="pt-3 border-t border-stone-200 space-y-3">
          <div className="text-xs font-semibold text-stone-900">Block New Dates</div>
          {error && <div className="text-xs text-red-600">{error}</div>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-2 text-xs border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase block mb-1">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as any)}
              className="w-full p-2 text-xs border rounded-lg bg-white"
            >
              <option value="maintenance">Routine Maintenance</option>
              <option value="owner_stay">Owner Private Stay</option>
              <option value="renovation">Renovation & Upgrades</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg text-stone-600 hover:bg-stone-100"
            >
              Done
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block Selected Dates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
