import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronDown, Heart, MessageSquare, Briefcase, Shield,
  User, Scale, FileText, GraduationCap, Home, Menu, X, BedDouble,
  CircleDollarSign, Globe, Award, HousePlus, CircleHelp, Handshake
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
  const { currentUser, switchRole, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
    setIsMobileNavOpen(false);
    if (role === 'host') {
      onNavigate('host-dashboard');
    } else if (role === 'admin') {
      onNavigate('admin-console');
    } else {
      onNavigate('explore');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-900 border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-18 flex items-center justify-between relative">
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

          {(!isAuthenticated || currentUser.role === 'host') && <button
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
          </button>}

          {(!isAuthenticated || currentUser.role === 'admin') && <button
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
          </button>}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">

          {/* Persona Switcher Selector */}
          {!isAuthenticated && <div className="relative hidden md:block">
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
          </div>}

          {/* User Profile Avatar / Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-slate-300 hover:border-slate-400 bg-white transition-colors cursor-pointer"
              aria-label="Open account menu"
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

            <button
              type="button"
              onClick={() => setIsMobileNavOpen(open => !open)}
              className="md:hidden p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileNavOpen}
              title={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        </div>

        {isMobileNavOpen && (
          <>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close More menu"
              className="md:hidden fixed inset-0 z-50 bg-black/35"
            />
            <aside aria-label="More" className="md:hidden fixed inset-y-0 right-0 z-[60] w-[min(82vw,320px)] max-w-full overflow-y-auto border-l border-slate-200 bg-white text-slate-900 shadow-xl">
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                <h2 className="font-sans text-lg font-semibold">More</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  aria-label="Close More menu"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 pt-2 pb-6">
                <div className="divide-y divide-slate-100">
                  <div className="flex min-h-12 items-center gap-3 py-2 text-sm">
                    <CircleDollarSign className="h-5 w-5 shrink-0 text-slate-600" />
                    <span className="font-medium">PHP</span>
                    <span>Philippine Peso</span>
                  </div>
                  <div className="flex min-h-12 items-center gap-3 py-2 text-sm">
                    <Globe className="h-5 w-5 shrink-0 text-slate-600" />
                    <span>English (UK)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsMobileNavOpen(false); onOpenAuth(); }}
                    className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:text-slate-600"
                  >
                    <Award className="h-5 w-5 shrink-0 text-slate-600" />
                    <span>Genius loyalty programme</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      if (!isAuthenticated) {
                        switchRole('host');
                        onNavigate('host-dashboard');
                      } else if (currentUser.role === 'host') {
                        onNavigate('host-dashboard');
                      } else {
                        onOpenAuth();
                      }
                    }}
                    className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:text-slate-600"
                  >
                    <HousePlus className="h-5 w-5 shrink-0 text-slate-600" />
                    <span>List your property</span>
                  </button>
                </div>

                <h3 className="mt-5 mb-1 font-sans text-sm font-semibold">Help and support</h3>
                <div className="divide-y divide-slate-100">
                  <button
                    type="button"
                    onClick={() => { setIsMobileNavOpen(false); onNavigate('messages'); }}
                    className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:text-slate-600"
                  >
                    <CircleHelp className="h-5 w-5 shrink-0 text-slate-600" />
                    <span>Contact Customer Service</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsMobileNavOpen(false); onNavigate('messages'); }}
                    className="flex min-h-12 w-full items-center gap-3 py-2 text-left text-sm hover:text-slate-600"
                  >
                    <Handshake className="h-5 w-5 shrink-0 text-slate-600" />
                    <span>Partner dispute</span>
                  </button>
                </div>

                {!isAuthenticated && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Switch demo account</p>
                    <div className="grid grid-cols-2 gap-1">
                      <button onClick={() => handleRoleSelect('student')} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"><GraduationCap className="h-4 w-4 shrink-0" />Student</button>
                      <button onClick={() => handleRoleSelect('renter')} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"><User className="h-4 w-4 shrink-0" />Renter</button>
                      <button onClick={() => handleRoleSelect('host')} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"><Briefcase className="h-4 w-4 shrink-0" />Landlord</button>
                      <button onClick={() => handleRoleSelect('admin')} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"><Shield className="h-4 w-4 shrink-0" />Admin</button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      <nav aria-label="Mobile primary navigation" className="md:hidden max-w-7xl mx-auto flex items-center gap-2 px-3 pb-3 overflow-x-auto whitespace-nowrap border-t border-slate-200 bg-white">
        <button
          onClick={() => onNavigate('explore')}
          aria-current={currentView === 'explore' || currentView === 'detail' ? 'page' : undefined}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${currentView === 'explore' || currentView === 'detail' ? 'border border-slate-300 bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <BedDouble className="w-5 h-5" /> Stays
        </button>
        <button
          onClick={() => onNavigate('favorites')}
          aria-current={currentView === 'favorites' ? 'page' : undefined}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${currentView === 'favorites' ? 'border border-slate-300 bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Heart className="w-5 h-5" /> Saved{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
        </button>
        <button
          onClick={() => onNavigate('applications')}
          aria-current={currentView === 'applications' ? 'page' : undefined}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${currentView === 'applications' ? 'border border-slate-300 bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <FileText className="w-5 h-5" /> Applications
        </button>
        <button
          onClick={onOpenComparison}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${compareCount > 0 ? 'border border-slate-300 bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Scale className="w-5 h-5" /> Compare{compareCount > 0 ? ` (${compareCount})` : ''}
        </button>
      </nav>
    </header>
  );
};
