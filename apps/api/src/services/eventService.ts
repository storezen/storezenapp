// Event Service - Core event tracking and aggregation
import { io } from "../app.js";

export type EventType = "page_view" | "product_view" | "add_to_cart" | "begin_checkout" | "purchase" | "search" | "wishlist";

export interface StoreEvent {
  id?: string;
  storeId: string;
  sessionId: string;
  eventType: EventType;
  productId?: string;
  orderId?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// In-memory event store (use Redis in production)
const eventStore: StoreEvent[] = [];
const MAX_EVENTS = 10000; // Keep last 10k events

// Intent classification
export type IntentLevel = "viewing" | "interested" | "highIntent";

export function getIntentLevel(eventType: EventType): IntentLevel {
  switch (eventType) {
    case "product_view":
    case "search":
      return "viewing";
    case "add_to_cart":
    case "wishlist":
      return "interested";
    case "begin_checkout":
    case "purchase":
      return "highIntent";
    default:
      return "viewing";
  }
}

export function trackEvent(event: StoreEvent): void {
  eventStore.push({ ...event, timestamp: event.timestamp || Date.now() });

  // Trim old events
  if (eventStore.length > MAX_EVENTS) {
    eventStore.splice(0, eventStore.length - MAX_EVENTS);
  }

  // Broadcast to admins
  if (io) {
    io.emit("activity_feed", {
      type: event.eventType,
      storeId: event.storeId,
      sessionId: event.sessionId,
      productId: event.productId,
      orderId: event.orderId,
      amount: event.amount,
      timestamp: event.timestamp,
      intent: getIntentLevel(event.eventType),
    });

    // Broadcast order updates
    if (event.eventType === "purchase" || event.eventType === "begin_checkout") {
      io.emit("order_update", {
        orderId: event.orderId,
        amount: event.amount,
        eventType: event.eventType,
        timestamp: event.timestamp,
      });
    }

    // Broadcast visitor updates per store
    const storeVisitors = getLiveVisitorsByStore(event.storeId);
    io.emit(`visitors_${event.storeId}`, storeVisitors);
  }
}

export function getEventsByStore(storeId: string, limit = 50): StoreEvent[] {
  return eventStore
    .filter(e => e.storeId === storeId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getIntentCounts(storeId: string, hours = 1): { viewing: number; interested: number; highIntent: number } {
  const since = Date.now() - hours * 3600000;
  const storeEvents = eventStore.filter(e => e.storeId === storeId && e.timestamp > since);

  return {
    viewing: storeEvents.filter(e => e.eventType === "product_view" || e.eventType === "search").length,
    interested: storeEvents.filter(e => e.eventType === "add_to_cart" || e.eventType === "wishlist").length,
    highIntent: storeEvents.filter(e => e.eventType === "begin_checkout" || e.eventType === "purchase").length,
  };
}

export function getLiveVisitorsByStore(storeId: string): { total: number; products: Record<string, number> } {
  const now = Date.now();
  const activeThreshold = 60000; // 60 seconds

  // Get unique active sessions from recent events
  const activeSessions = new Map<string, { productId?: string; lastSeen: number }>();

  eventStore
    .filter(e => e.storeId === storeId && now - e.timestamp < activeThreshold)
    .forEach(e => {
      const existing = activeSessions.get(e.sessionId);
      if (!existing || e.timestamp > existing.lastSeen) {
        activeSessions.set(e.sessionId, { productId: e.productId, lastSeen: e.timestamp });
      }
    });

  // Count product-wise
  const products: Record<string, number> = {};
  activeSessions.forEach(session => {
    if (session.productId) {
      products[session.productId] = (products[session.productId] || 0) + 1;
    }
  });

  return {
    total: activeSessions.size,
    products,
  };
}

export function getTrendingProducts(storeId: string, hours = 1): Array<{ productId: string; views: number; carts: number; purchases: number }> {
  const since = Date.now() - hours * 3600000;
  const storeEvents = eventStore.filter(e => e.storeId === storeId && e.timestamp > since && e.productId);

  const productStats = new Map<string, { views: number; carts: number; purchases: number }>();

  storeEvents.forEach(e => {
    if (!e.productId) return;
    const stats = productStats.get(e.productId) || { views: 0, carts: 0, purchases: 0 };
    if (e.eventType === "product_view") stats.views++;
    if (e.eventType === "add_to_cart") stats.carts++;
    if (e.eventType === "purchase") stats.purchases++;
    productStats.set(e.productId, stats);
  });

  return Array.from(productStats.entries())
    .map(([productId, stats]) => ({ productId, ...stats }))
    .sort((a, b) => (b.views + b.carts * 2 + b.purchases * 3) - (a.views + a.carts * 2 + a.purchases * 3))
    .slice(0, 5);
}

export function getActivityFeed(storeId: string, limit = 20): Array<{
  id: string;
  type: EventType;
  intent: IntentLevel;
  productId?: string;
  orderId?: string;
  amount?: number;
  timestamp: number;
}> {
  return eventStore
    .filter(e => e.storeId === storeId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map(e => ({
      id: e.id || Math.random().toString(36).slice(2),
      type: e.eventType,
      intent: getIntentLevel(e.eventType),
      productId: e.productId,
      orderId: e.orderId,
      amount: e.amount,
      timestamp: e.timestamp,
    }));
}