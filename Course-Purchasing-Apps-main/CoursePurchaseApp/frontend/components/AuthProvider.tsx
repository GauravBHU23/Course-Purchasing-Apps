"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { api, User } from "@/lib/api";

type RefreshOptions = {
  allowRefresh?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: (options?: RefreshOptions) => Promise<User | null>;
  setUser: (user: User | null) => void;
  clearUser: () => void;
};

const GUEST_ONLY_ROUTES = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email"
]);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshUser(options: RefreshOptions = {}): Promise<User | null> {
    setLoading(true);
    try {
      const nextUser = await api.me({ skipRefresh: options.allowRefresh === false });
      setUser(nextUser);
      setError(null);
      return nextUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Not authenticated";
      setUser(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (GUEST_ONLY_ROUTES.has(pathname)) {
      setLoading(false);
      return;
    }

    if (user) {
      setLoading(false);
      return;
    }

    void refreshUser();
  }, [pathname, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      setUser,
      clearUser: () => {
        setUser(null);
        setError(null);
        setLoading(false);
      }
    }),
    [error, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
