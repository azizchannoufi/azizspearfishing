"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { getAdminClaim, logout as firebaseLogout } from "@/lib/firebase/auth";

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        const admin = await getAdminClaim(next, true);
        setIsAdmin(admin);
        document.cookie = `admin_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } else {
        setIsAdmin(false);
        document.cookie = "admin_session=; path=/; max-age=0";
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  const getToken = useCallback(
    async (forceRefresh = false) => {
      if (!user) return null;
      return user.getIdToken(forceRefresh);
    },
    [user],
  );

  const logout = useCallback(async () => {
    await firebaseLogout();
    document.cookie = "admin_session=; path=/; max-age=0";
  }, []);

  const refreshClaims = useCallback(async () => {
    if (!user) return;
    const admin = await getAdminClaim(user, true);
    setIsAdmin(admin);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      configured,
      getToken,
      logout,
      refreshClaims,
    }),
    [user, isAdmin, loading, configured, getToken, logout, refreshClaims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
