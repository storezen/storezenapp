export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("dashboard_token") ?? "";
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("dashboard_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("dashboard_token");
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
