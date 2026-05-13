// Track visitor session for live visitor count
const SESSION_KEY = "visitor_session";

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "";

  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = "v_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export async function trackStoreVisitor(storeId: string, page?: string) {
  if (typeof window === "undefined") return;

  const sessionId = getOrCreateSession();
  try {
    await fetch("/api/visitors/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, sessionId, page }),
    });
  } catch {
    // Silent fail - visitor tracking should not break the store
  }
}

export async function getLiveVisitors(storeId: string): Promise<{ live: number; last30Min: number; timestamp: number } | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch(`/api/visitors/${storeId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}