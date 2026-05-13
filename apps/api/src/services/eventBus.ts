/**
 * EVENT BUS
 *
 * Central event system for all order events.
 * Handles event dispatching, storage, and WebSocket broadcasting.
 */

import { EventEmitter } from "events";
import { db } from "../db";
import { orderEventsTable } from "../db/schema";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

// Event types
export type EventType =
  | "order_created"
  | "order_confirmed"
  | "order_status_updated"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_returned";

export interface OrderEvent {
  id: string;
  orderId: string;
  storeId: string;
  eventType: EventType;
  previousStatus: string | null;
  newStatus: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Event payload for listeners
export interface EventPayload {
  orderId: string;
  storeId: string;
  eventType: EventType;
  previousStatus: string | null;
  newStatus: string | null;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

type EventHandler = (payload: EventPayload) => Promise<void> | void;

/**
 * Event Bus - Singleton pattern
 */
class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;
  private handlers: Map<string, EventHandler[]> = new Map();
  private wsClients: Map<string, Set<(event: EventPayload) => void>> = new Map();

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: EventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from event
   */
  off(eventType: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Register WebSocket client for store
   */
  registerWSClient(storeId: string, sendFn: (event: EventPayload) => void): void {
    if (!this.wsClients.has(storeId)) {
      this.wsClients.set(storeId, new Set());
    }
    this.wsClients.get(storeId)!.add(sendFn);
  }

  /**
   * Unregister WebSocket client
   */
  unregisterWSClient(storeId: string, sendFn: (event: EventPayload) => void): void {
    const clients = this.wsClients.get(storeId);
    if (clients) {
      clients.delete(sendFn);
    }
  }

  /**
   * Emit event - stores in DB and notifies all subscribers
   */
  async emit(payload: EventPayload): Promise<void> {
    const { orderId, storeId, eventType, previousStatus, newStatus, metadata, timestamp } = payload;

    // 1. Store event in database
    try {
      await db.insert(orderEventsTable).values({
        id: randomUUID(),
        orderId,
        storeId,
        eventType,
        previousStatus,
        newStatus,
        metadata: metadata || {},
        createdAt: new Date(timestamp),
      });
    } catch (error) {
      console.error(`[EventBus] Failed to store event: ${error}`);
    }

    // 2. Emit to local handlers (non-blocking)
    this.emitter.emit(eventType, payload);

    // Execute registered handlers
    const handlers = this.handlers.get(eventType) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${eventType}:`, error);
      }
    }

    // 3. Broadcast to WebSocket clients (non-blocking)
    const clients = this.wsClients.get(storeId);
    if (clients) {
      const wsPayload = { ...payload, timestamp };
      for (const clientSend of clients) {
        try {
          clientSend(wsPayload);
        } catch (error) {
          console.error(`[EventBus] WebSocket send error:`, error);
        }
      }
    }

    // Also broadcast to all stores (for admin dashboard)
    const allClients = this.wsClients.get("*");
    if (allClients) {
      for (const clientSend of allClients) {
        try {
          clientSend(payload);
        } catch (error) {
          console.error(`[EventBus] Broadcast WebSocket error:`, error);
        }
      }
    }
  }

  /**
   * Get event history for an order
   */
  async getOrderEvents(orderId: string): Promise<OrderEvent[]> {
    const events = await db
      .select()
      .from(orderEventsTable)
      .where(eq(orderEventsTable.orderId, orderId))
      .orderBy(orderEventsTable.createdAt);

    return events as OrderEvent[];
  }

  /**
   * Get recent events for a store
   */
  async getStoreEvents(storeId: string, limit = 50): Promise<OrderEvent[]> {
    const events = await db
      .select()
      .from(orderEventsTable)
      .where(eq(orderEventsTable.storeId, storeId))
      .orderBy(orderEventsTable.createdAt)
      .limit(limit);

    return (events as OrderEvent[]).reverse();
  }
}

export const eventBus = EventBus.getInstance();

/**
 * Helper function to emit order event
 */
export function emitOrderEvent(
  orderId: string,
  storeId: string,
  eventType: EventType,
  previousStatus: string | null,
  newStatus: string | null,
  metadata?: Record<string, unknown>
): void {
  eventBus.emit({
    orderId,
    storeId,
    eventType,
    previousStatus,
    newStatus,
    metadata,
    timestamp: Date.now(),
  });
}