/**
 * REAL-TIME ORDER SYNC SERVICE
 *
 * Handles WebSocket connections for live order updates.
 * Broadcasts order events to connected clients.
 */

import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { eventBus, type EventPayload, type EventType } from "./eventBus";

// Store client connections
const storeClients = new Map<string, Set<Socket>>();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/ws",
  });

  io.on("connection", (socket: Socket) => {
    // Extract store ID from query or auth
    const storeId = socket.handshake.query.storeId as string;
    const token = socket.handshake.auth.token;

    if (storeId) {
      // Add to store-specific clients
      if (!storeClients.has(storeId)) {
        storeClients.set(storeId, new Set());
      }
      storeClients.get(storeId)!.add(socket);

      // Register with event bus for this store
      eventBus.registerWSClient(storeId, (event: EventPayload) => {
        socket.emit("order_event", event);
      });
    }

    // Handle subscription to specific order
    socket.on("subscribe_order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("unsubscribe_order", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // Handle ping/pong for connection health
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      // Remove from store clients
      if (storeId && storeClients.has(storeId)) {
        storeClients.get(storeId)!.delete(socket);
        if (storeClients.get(storeId)!.size === 0) {
          storeClients.delete(storeId);
        }
      }

      // Unregister from event bus
      eventBus.unregisterWSClient(storeId, () => {});
    });
  });

  // Broadcast events to specific room
  eventBus.on("order_status_updated", (payload: EventPayload) => {
    io.to(`order:${payload.orderId}`).emit("order_event", payload);
  });

  return io;
}

/**
 * Get connected client count for a store
 */
export function getStoreClientCount(storeId: string): number {
  return storeClients.get(storeId)?.size || 0;
}

/**
 * Get all active store IDs with connected clients
 */
export function getActiveStores(): string[] {
  return Array.from(storeClients.keys());
}

/**
 * Broadcast to all clients (admin dashboard)
 */
export function broadcastToAllStores(event: EventPayload) {
  for (const [storeId, clients] of storeClients.entries()) {
    for (const client of clients) {
      try {
        client.emit("order_event", event);
      } catch {
        // Client might be disconnected
      }
    }
  }
}

/**
 * Send to specific client
 */
export function sendToClient(storeId: string, clientId: string, event: EventPayload) {
  const clients = storeClients.get(storeId);
  if (!clients) return;

  for (const client of clients) {
    if (client.id === clientId) {
      client.emit("order_event", event);
      break;
    }
  }
}