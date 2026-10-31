import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { store } from '../services/store';
import { ApiError, ApiUser, authApi } from '../services/api';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  setCurrentUserById: (userId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isHost: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authApi.getToken()));
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionRevision = useRef(0);

  const syncApiUser = (apiUser: ApiUser): void => {
    const id = `api-${apiUser.id}`;
    const previous = store.getUsers().find(user => user.id === id);
    const now = new Date().toISOString();
    const user: User = {
      id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role === 'owner' ? 'host' : apiUser.role,
      status: apiUser.account_status === 'active' ? 'active' : 'suspended',
      emailVerifiedAt: apiUser.email_verified_at || undefined,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };

    store.setSessionUser(user);
    setAuthError(null);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });

    let cancelled = false;
    const token = authApi.getToken();
    const revision = sessionRevision.current;
    const isCurrentSession = () => !cancelled && revision === sessionRevision.current && token === authApi.getToken();
    if (token) {
      void authApi.me()
        .then(user => {
          if (isCurrentSession()) syncApiUser(user);
        })
        .catch((error: unknown) => {
          if (!isCurrentSession()) return;
          setAuthError(error instanceof Error ? error.message : 'Could not restore your session.');
          if (error instanceof ApiError && error.status === 401) {
            authApi.clearToken();
            setIsAuthenticated(false);
            store.setCurrentUser('user-student-1');
          }
        });
    }

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const switchRole = (role: UserRole) => {
    if (isAuthenticated) return;
    // Find first user with that role or switch current user's role
    const users = store.getUsers();
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      store.setCurrentUser(targetUser.id);
    } else {
      // Create or switch current
      store.updateUserRole(currentUser.id, role);
    }
  };

  const setCurrentUserById = (userId: string) => {
    sessionRevision.current += 1;
    authApi.clearToken();
    setAuthError(null);
    setIsAuthenticated(false);
    store.setCurrentUser(userId);
  };

  const login = async (email: string, password: string): Promise<void> => {
    sessionRevision.current += 1;
    const user = await authApi.login(email, password);
    syncApiUser(user);
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'student'): Promise<void> => {
    const apiRole = role === 'host' ? 'owner' : role;
    if (apiRole !== 'student' && apiRole !== 'renter' && apiRole !== 'owner') {
      throw new Error('This role cannot be registered publicly.');
    }

    sessionRevision.current += 1;
    const user = await authApi.register(name, email, password, apiRole);
    syncApiUser(user);
  };

  const logout = async () => {
    sessionRevision.current += 1;
    try {
      await authApi.logout();
      setAuthError(null);
    } catch (error: unknown) {
      setAuthError(error instanceof Error ? `Signed out locally, but server logout failed: ${error.message}` : 'Signed out locally, but server logout failed.');
    } finally {
      setIsAuthenticated(false);
      store.setCurrentUser('user-student-1');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        setCurrentUserById,
        login,
        register,
        logout,
        isAuthenticated,
        isHost: currentUser.role === 'host',
        isAdmin: currentUser.role === 'admin',
        isGuest: currentUser.role === 'student' || currentUser.role === 'renter',
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
