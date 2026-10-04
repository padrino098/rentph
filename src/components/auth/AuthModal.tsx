import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { X, Shield, User, Briefcase, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, setCurrentUserById } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!name.trim() || !email.trim()) {
        setError('Please fill in all required fields.');
        return;
      }
      try {
        register(name.trim(), email.trim(), role);
        onClose();
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      const success = login(email.trim());
      if (success) {
        onClose();
      } else {
        setError('No account found with this email. Try one of the demo accounts below or create an account.');
      }
    }
  };

  const handleQuickDemoLogin = (userId: string) => {
    setCurrentUserById(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-serif text-lg text-slate-900">
            {isRegister ? 'Join RentPH' : 'Welcome to RentPH'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Fast Logins */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            One-Click Demo Personas
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => handleQuickDemoLogin('user-student-1')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-slate-400 flex flex-col items-center gap-1 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-medium text-[10px]">Student</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('user-renter-1')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-slate-400 flex flex-col items-center gap-1 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-medium text-[10px]">Renter</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('user-host-1')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-slate-400 flex flex-col items-center gap-1 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium text-[10px]">Landlord</span>
            </button>
            <button
              onClick={() => handleQuickDemoLogin('user-admin-1')}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800 hover:border-slate-400 flex flex-col items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-slate-800" />
              <span className="font-medium text-[10px]">Admin</span>
            </button>
          </div>
        </div>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2 text-[11px] text-slate-400 uppercase">
            or with credentials
          </span>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Keneth Jassal"
                required
                className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@domain.com"
              required
              className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">I am registering as:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                    role === 'student' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('renter')}
                  className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                    role === 'renter' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Renter
                </button>
                <button
                  type="button"
                  onClick={() => setRole('host')}
                  className={`p-2 rounded-lg border text-xs font-medium cursor-pointer ${
                    role === 'host' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Landlord
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-100 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
