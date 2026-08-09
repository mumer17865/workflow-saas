"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch, refreshSession } from "@/lib/api-client";
import {
  setAccessToken,
  clearAccessToken,
  setActiveOrgId,
} from "@/lib/auth-store";
import type { AuthResponse, AuthUser, OrganizationSummary } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  activeOrg: OrganizationSummary | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const hydrateUser = useCallback(async () => {
    const me = await apiFetch<AuthUser>("/auth/me");
    setUser(me);
    setActiveOrgId(me.organizations?.[0]?.id ?? null);
    return me;
  }, []);

  // On first load, try to restore the session from the httpOnly refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      const restored = await refreshSession();
      if (!active) return;
      if (!restored) {
        setStatus("unauthenticated");
        return;
      }
      try {
        await hydrateUser();
        if (active) setStatus("authenticated");
      } catch {
        if (!active) return;
        clearAccessToken();
        setStatus("unauthenticated");
      }
    })();
    return () => {
      active = false;
    };
  }, [hydrateUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      await hydrateUser();
      setStatus("authenticated");
    },
    [hydrateUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setAccessToken(data.accessToken);
      await hydrateUser();
      setStatus("authenticated");
    },
    [hydrateUser],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearAccessToken();
      setActiveOrgId(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await hydrateUser();
  }, [hydrateUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      activeOrg: user?.organizations?.[0] ?? null,
      status,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
