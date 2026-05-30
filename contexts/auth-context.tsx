import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  getSession,
  registerSessionExpiredHandler,
  type SessionPayload,
  signInWithEmail,
  signOut as apiSignOut,
  signUpWithEmail,
  type User,
} from '@/lib/matchday-api';

type AuthContextValue = {
  loading: boolean;
  session: SessionPayload | null;
  user: User | null;
  refreshSession: () => Promise<SessionPayload | null>;
  signIn: (payload: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string; callbackURL?: string }) => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<SessionPayload | null>(null);

  const clearSession = useCallback(() => {
    if (sessionRef.current === null) return;
    sessionRef.current = null;
    setSession(null);
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(clearSession);
  }, [clearSession]);

  const refreshSession = useCallback(async () => {
    try {
      const next = await getSession();
      // skip setState if session identity hasn't changed → no cascade re-renders
      const prev = sessionRef.current;
      const sameUser = prev?.user?.id === next?.user?.id;
      const sameSession = prev?.session?.id === next?.session?.id;
      const sameUserData =
        prev?.user?.email === next?.user?.email &&
        prev?.user?.name === next?.user?.name &&
        prev?.user?.image === next?.user?.image &&
        prev?.user?.emailVerified === next?.user?.emailVerified;
      if (!sameUser || !sameSession || !sameUserData) {
        sessionRef.current = next;
        setSession(next);
      }
      return next;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (payload: { email: string; password: string; rememberMe: boolean }) => {
    const next = await signInWithEmail(payload);
    sessionRef.current = next;
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiSignOut();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const signUp = useCallback(async (payload: { name: string; email: string; password: string; callbackURL?: string }) => {
    await signUpWithEmail(payload);
    await refreshSession();
  }, [refreshSession]);

  const updateUser = useCallback((patch: Partial<User>) => {
    const current = sessionRef.current;
    if (!current?.user) return;

    const next = {
      ...current,
      user: { ...current.user, ...patch },
    };
    sessionRef.current = next;
    setSession(next);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      refreshSession,
      session,
      signIn,
      signOut,
      signUp,
      updateUser,
      user: session?.user ?? null,
    }),
    [loading, refreshSession, session, signIn, signOut, signUp, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
