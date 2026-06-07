import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';

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
    if (!auth) {
      console.warn("Firebase Auth not initialized. Checking session only.");
      checkAuth();
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
            credentials: 'include'
          });
          
          if (res.ok) {
            const data = await res.json();
            // Small delay to ensure cookie is processed by the browser
            await new Promise(resolve => setTimeout(resolve, 500));
            setUser(data);
          } else {
            // If backend fails, sign out from firebase
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.error('Firebase sync failed', err);
          setUser(null);
        }
      } else {
        // Check if we still have a session
        checkAuth();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed', err);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // 1. Check if it looks like an email. If not, go straight to legacy login.
      const isEmail = email.includes('@');
      
      if (isEmail && auth && auth.app) {
        console.log('Attempting Firebase login...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        // 2. Sync with backend session
        const res = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          // Small delay to ensure cookie is processed by the browser
          await new Promise(resolve => setTimeout(resolve, 500));
          setUser(data);
          return;
        } else {
          console.warn('Firebase sync failed, falling back to legacy login');
        }
      }
      
      // Fallback to legacy login if not an email, firebase is not configured, or sync fails
      return legacyLogin(email, password);
    } catch (err: any) {
      console.error('Login attempt failed:', err.code || err.message, err);
      
      // Handle specific Firebase errors that should trigger legacy fallback
      const fallbackCodes = [
        'auth/user-not-found', 
        'auth/wrong-password', 
        'auth/invalid-credential', 
        'auth/invalid-email', 
        'auth/user-disabled',
        'auth/operation-not-allowed'
      ];
      
      if (err.code && fallbackCodes.includes(err.code)) {
        console.log('Firebase error caught, attempting legacy login fallback...');
        return legacyLogin(email, password);
      }
      
      // If it's a legacy login error, it will already be an Error object with a message
      throw err;
    }
  };

  const legacyLogin = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      // Small delay to ensure cookie is processed by the browser
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(data);
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Login falhou');
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
