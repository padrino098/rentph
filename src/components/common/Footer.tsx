import React from 'react';
import { Globe } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-20 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="font-semibold text-stone-900 mb-3 uppercase tracking-wider text-[11px]">
              Curated Stays
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Coastal Sanctuaries
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Alpine Timber Lodges
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Desert Rammed-Earth
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Renaissance Lofts
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3 uppercase tracking-wider text-[11px]">
              Hosting
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('host-dashboard')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Host an Architectural Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('host-dashboard')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Curation & Quality Standards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('host-dashboard')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Host Protection Insurance
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('host-dashboard')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Community Forum
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3 uppercase tracking-wider text-[11px]">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('trips')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Reservation Policies
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('messages')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Direct Guest Inquiries
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin-console')} className="hover:text-stone-900 transition-colors cursor-pointer">
                  Admin Oversight & Audit
                </button>
              </li>
              <li>
                <span className="text-stone-400">Security & Trust Verification</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-900 mb-3 uppercase tracking-wider text-[11px]">
              RentPH Marketplace
            </h4>
            <p className="leading-relaxed text-stone-500 mb-4 text-[11px]">
              The Philippines' premier vacation rental marketplace for luxury island villas, designer lofts, and curated staycations.
            </p>
            <div className="flex items-center gap-2 text-stone-700">
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>English (PH)</span>
              <span className="text-stone-300">·</span>
              <span className="font-medium">₱ PHP / $ USD</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <div>
            © 2026 RentPH Inc. All rights reserved. Vacation rentals & property booking platform.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-stone-700 cursor-pointer">Privacy</span>
            <span>·</span>
            <span className="hover:text-stone-700 cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-stone-700 cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
