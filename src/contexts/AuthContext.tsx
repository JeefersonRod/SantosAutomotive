import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => setUser(null);
    window.addEventListener('santos:session-expired', handleSessionExpired);
    return () => window.removeEventListener('santos:session-expired', handleSessionExpired);
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authService.me();
      setUser(data);
    } catch (err) {
      console.error('Auth check failed', err);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    // Small delay to ensure cookie is processed by the browser
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
