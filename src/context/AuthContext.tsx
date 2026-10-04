import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { store } from '../services/store';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  setCurrentUserById: (userId: string) => void;
  login: (email: string) => boolean;
  register: (name: string, email: string, role?: UserRole) => void;
  logout: () => void;
  isHost: boolean;
  isAdmin: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
    return unsub;
  }, []);

  const switchRole = (role: UserRole) => {
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
    store.setCurrentUser(userId);
  };

  const login = (email: string): boolean => {
    const user = store.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      store.setCurrentUser(user.id);
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, role: UserRole = 'student') => {
    const user = store.registerUser(name, email, role);
    store.setCurrentUser(user.id);
  };

  const logout = () => {
    // Default to first student
    store.setCurrentUser('user-student-1');
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
        isHost: currentUser.role === 'host',
        isAdmin: currentUser.role === 'admin',
        isGuest: currentUser.role === 'student' || currentUser.role === 'renter',
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
