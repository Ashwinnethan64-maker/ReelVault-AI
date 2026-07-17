import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      setIsLoading(true);
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (mounted) {
          setSession(initialSession);
          if (initialSession) {
            await syncBackendUser();
          }
        }
      } catch (err) {
        console.error("Error getting initial session:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await syncBackendUser();
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncBackendUser = async () => {
    try {
      // The api interceptor automatically adds the Bearer token from the session
      const res = await api.get('/auth/sync');
      setUser(res.data);
    } catch (error) {
      console.error("Failed to sync user with backend", error);
      // If we get a 401, it means the token is invalid or user couldn't be created.
      setUser(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
