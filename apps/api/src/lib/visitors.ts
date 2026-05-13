// Simple in-memory visitor tracking for live visitors
// In production, consider using Redis for distributed apps

interface VisitorSession {
  storeId: string;
  lastSeen: number;
  page?: string;
}

const sessions = new Map<string, VisitorSession>();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity

// Cleanup old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastSeen > SESSION_TIMEOUT) {
      sessions.delete(id);
    }
  }
}, CLEANUP_INTERVAL);

export function trackVisitor(storeId: string, sessionId: string, page?: string) {
  sessions.set(sessionId, { storeId, lastSeen: Date.now(), page });
}

export function getLiveVisitorCount(storeId: string): number {
  const now = Date.now();
  let count = 0;
  for (const session of sessions.values()) {
    if (session.storeId === storeId && now - session.lastSeen < SESSION_TIMEOUT) {
      count++;
    }
  }
  return count;
}

export function getStoreVisitorStats(storeId: string) {
  const now = Date.now();
  const activeVisitors = getLiveVisitorCount(storeId);

  // For demo: estimate based on recent activity
  const recentSessions = Array.from(sessions.values())
    .filter(s => s.storeId === storeId && now - s.lastSeen < 30 * 60 * 1000) // last 30 min

  return {
    live: activeVisitors,
    last30Min: recentSessions.length,
    timestamp: now,
  };
}