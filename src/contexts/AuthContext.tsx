import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout, type ApiUser } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await getMe();
    setUser(u);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      getMe().then(setUser).finally(() => setLoading(false));
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
        getMe().then(setUser);
      });
      return () => subscription.unsubscribe();
    }
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await apiLogin(email, password);
      setUser(u);
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const u = await apiRegister(email, password, name);
      setUser(u);
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
