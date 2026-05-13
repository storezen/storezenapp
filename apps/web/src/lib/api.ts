const BASE = process.env.NEXT_PUBLIC_API_URL;

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_API === "1";
const DEBUG_VERBOSE = process.env.NEXT_PUBLIC_DEBUG_API_VERBOSE === "1";

function logApiOk(method: string, path: string, status: number) {
  if (DEBUG && DEBUG_VERBOSE) console.log("[api:ok]", { method, path, status });
}
function logApiErr(method: string, path: string, status: number, errBody: string) {
  if (!DEBUG) return;
  console.warn("[api:err]", { method, path, status, errBody: errBody.length > 500 ? errBody.slice(0, 500) + "…" : errBody });
}

/** Parse error body into human-readable message. */
function parseErrorBody(body: string, status: number): string {
  const t = body.trim();

  // JSON response
  if (t.startsWith("{")) {
    try {
      const p = JSON.parse(t) as Record<string, unknown>;
      // String error field
      if (typeof p.error === "string" && p.error.length > 0) return p.error;
      // Zod flatten formErrors
      if (Array.isArray(p.formErrors) && p.formErrors.length > 0) return p.formErrors.join("; ");
      // Zod fieldErrors
      if (p.fieldErrors && typeof p.fieldErrors === "object") {
        const msgs = Object.values(p.fieldErrors as Record<string, unknown[]>).flat().filter(Boolean).map(String);
        if (msgs.length > 0) return msgs.slice(0, 5).join("; ");
      }
      // Generic message field
      if (typeof p.message === "string" && p.message.length > 0) return p.message;
      // Fallback: stringify the whole object
      return JSON.stringify(p);
    } catch { /* fall through */ }
  }

  // HTML response (wrong server)
  if (t.startsWith("<!") || t.includes("<html")) {
    if (t.includes("Cannot GET") && t.includes("/api/")) {
      return "API not found. Set NEXT_PUBLIC_API_URL to your Express server URL.";
    }
    return "Server returned HTML instead of JSON. Check your API URL.";
  }

  // Truncate long plain-text errors
  if (t.length > 400) return `${t.slice(0, 200)}… (${status})`;

  return t || `Request failed (${status})`;
}

export async function apiFetch(url: string, opts: RequestInit = {}) {
  const path = String(BASE) + url;
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logApiErr(opts.method ?? "GET", path, res.status, body);
    throw new Error(parseErrorBody(body, res.status));
  }
  logApiOk(opts.method ?? "GET", path, res.status);
  return res.json();
}

export async function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }
  return apiFetch(url, {
    ...opts,
    headers: {
      ...(opts.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function authFetchText(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const path = String(BASE) + url;
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "text/plain",
      ...(opts.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logApiErr(opts.method ?? "GET", path, res.status, body);
    throw new Error(parseErrorBody(body, res.status));
  }
  logApiOk(opts.method ?? "GET", path, res.status);
  return res.text();
}