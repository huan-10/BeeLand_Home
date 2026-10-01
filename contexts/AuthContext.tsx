import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { clearSession, loadSession, saveSession } from '@/lib/sessionStorage';
import { getCurrentUser, login, logout } from '@/services';
import type { AuthSession, User } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Khôi phục phiên đã lưu khi mở ứng dụng.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSession();
      const currentUser = stored ? await getCurrentUser(stored).catch(() => null) : null;
      if (cancelled) return;
      if (stored && currentUser) {
        setSession(stored);
        setUser(currentUser);
        setStatus('authenticated');
      } else {
        if (stored) await clearSession();
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await login(email, password);
    await saveSession(result.session);
    setSession(result.session);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await logout(session).catch(() => undefined);
    await clearSession();
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
  }, [session]);

  const value = useMemo(() => ({ status, user, signIn, signOut }), [status, user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}
