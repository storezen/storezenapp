import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { API_URL } from "@/config";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  storeId: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

/** Per product spec: persist session JWT under `token`. */
const TOKEN_KEY = "token";
const LEGACY_TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(raw: Record<string, unknown> | null | undefined): AuthUser | null {
  if (!raw || typeof raw.id !== "string") return null;
  return {
    id: raw.id,
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    plan: String(raw.plan ?? "free"),
    storeId: typeof raw.storeId === "string" ? raw.storeId : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        let savedToken = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
        if (savedToken) {
          localStorage.setItem(TOKEN_KEY, savedToken);
          localStorage.removeItem(LEGACY_TOKEN_KEY);
        }
        let savedUser = localStorage.getItem(USER_KEY);
        let parsedUser: AuthUser | null = null;
        if (savedUser) {
          try {
            parsedUser = normalizeUser(JSON.parse(savedUser) as Record<string, unknown>);
          } catch {
            localStorage.removeItem(USER_KEY);
          }
        }
        if (cancelled) return;
        setToken(savedToken);

        if (savedToken && !parsedUser) {
          const resp = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const data = (await resp.json().catch(() => ({}))) as { user?: Record<string, unknown> };
          if (resp.ok && data.user) {
            parsedUser = normalizeUser(data.user);
            if (parsedUser) localStorage.setItem(USER_KEY, JSON.stringify(parsedUser));
          }
        }
        if (!cancelled) setUser(parsedUser);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const resp = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error ?? "Login failed");

    const u = normalizeUser(data.user as Record<string, unknown>);
    if (!u) throw new Error("Invalid login response");

    setToken(data.token);
    setUser(u);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  async function register(name: string, email: string, password: string) {
    const resp = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error ?? "Registration failed");

    const u = normalizeUser(data.user as Record<string, unknown>);
    if (!u) throw new Error("Invalid registration response");

    setToken(data.token);
    setUser(u);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
