import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown, Heart, MessageSquare, Briefcase, Shield,
  User, Scale, FileText, GraduationCap, Home
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  favoritesCount: number;
  compareCount: number;
  onOpenComparison: () => void;
  onOpenStudentMatcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  favoritesCount,
  compareCount,
  onOpenComparison,
  onOpenStudentMatcher,
}) => {
  const { currentUser, switchRole, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
    if (role === 'host') {
      onNavigate('host-dashboard');
    } else if (role === 'admin') {
      onNavigate('admin-console');
    } else {
      onNavigate('explore');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('explore')}
          className="text-2xl font-serif tracking-tight text-slate-900 hover:text-slate-700 transition-colors shrink-0 text-left cursor-pointer"
        >
          Rent<span className="text-amber-600 font-sans font-bold">PH</span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <button
            onClick={() => onNavigate('explore')}
            className={`transition-colors pb-1 border-b-2 cursor-pointer ${
              currentView === 'explore'
                ? 'text-slate-900 border-slate-900'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Housing Search
          </button>

          <button
            onClick={() => onNavigate('applications')}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 cursor-pointer ${
              currentView === 'applications'
                ? 'text-slate-900 border-slate-900'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Applications</span>
          </button>

          <button
            onClick={onOpenComparison}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 cursor-pointer ${
              compareCount > 0 ? 'text-slate-900 border-slate-900 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Compare {compareCount > 0 && `(${compareCount})`}</span>
          </button>

          <button
            onClick={() => onNavigate('favorites')}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 cursor-pointer ${
              currentView === 'favorites'
                ? 'text-slate-900 border-slate-900'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'text-amber-600 fill-amber-600' : ''}`} />
            <span>Saved {favoritesCount > 0 && `(${favoritesCount})`}</span>
          </button>

          <button
            onClick={() => {
              if (currentUser.role !== 'host') switchRole('host');
              onNavigate('host-dashboard');
            }}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 cursor-pointer ${
              currentView.startsWith('host')
                ? 'text-slate-900 border-slate-900'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Landlord Portal</span>
          </button>

          <button
            onClick={() => {
              if (currentUser.role !== 'admin') switchRole('admin');
              onNavigate('admin-console');
            }}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 cursor-pointer ${
              currentView.startsWith('admin')
                ? 'text-slate-900 border-slate-900'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              title="Test the platform as Student, Renter, Landlord, or Admin"
            >
              <span className="capitalize text-slate-500">{currentUser.role}:</span>
              <span className="font-semibold text-slate-900 truncate max-w-28">{currentUser.name.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left">
                <div className="px-3 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Switch Persona (Demo)
                </div>
                <button
                  onClick={() => handleRoleSelect('student')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'student' ? 'font-semibold text-slate-900 bg-slate-100/70' : 'text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-amber-600" />
                      <span>Student (UST Arch)</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Keneth Jassal</div>
                  </div>
                  {currentUser.role === 'student' && <span className="text-slate-900">✓</span>}
                </button>

                <button
                  onClick={() => handleRoleSelect('renter')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'renter' ? 'font-semibold text-slate-900 bg-slate-100/70' : 'text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-600" />
                      <span>General Renter</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Patricia Gomez (Professional)</div>
                  </div>
                  {currentUser.role === 'renter' && <span className="text-slate-900">✓</span>}
                </button>

                <button
                  onClick={() => handleRoleSelect('host')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'host' ? 'font-semibold text-slate-900 bg-slate-100/70' : 'text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-emerald-600" />
                      <span>Property Landlord</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Maria Santos (Dorm Owner)</div>
                  </div>
                  {currentUser.role === 'host' && <span className="text-slate-900">✓</span>}
                </button>

                <button
                  onClick={() => handleRoleSelect('admin')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    currentUser.role === 'admin' ? 'font-semibold text-slate-900 bg-slate-100/70' : 'text-slate-600'
                  }`}
                >
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-600" />
                      <span>Platform Admin</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">Full platform oversight</div>
                  </div>
                  {currentUser.role === 'admin' && <span className="text-slate-900">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar / Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-slate-300 hover:border-slate-400 bg-white transition-colors cursor-pointer"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="font-semibold text-xs text-slate-900 truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  {currentUser.schoolName && (
                    <div className="text-[10px] text-amber-700 font-semibold truncate mt-0.5">
                      🎓 {currentUser.schoolName}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('applications');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Applications</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('trips');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Current Rentals</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenComparison();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span>Comparison Matrix</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Switch Account / Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
