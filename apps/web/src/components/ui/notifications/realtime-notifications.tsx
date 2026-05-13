"use client";

import { useEffect, useRef, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { useToast } from "./toast-system";
import { useAuth } from "@/hooks/use-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EventType =
  | "order_created"
  | "order_confirmed"
  | "order_status_updated"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "new_user"
  | "low_stock"
  | "courier_update";

export interface RealtimeEvent {
  id: string;
  type: EventType;
  orderId?: string;
  storeId: string;
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

interface RealtimeContextValue {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  events: RealtimeEvent[];
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  reconnect: () => void;
}

// ── Event Configuration ─────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<EventType, {
  title: string;
  icon: string;
  color: "success" | "error" | "warning" | "info";
  autoShow: boolean;
}> = {
  order_created: { title: "New Order!", icon: "🛒", color: "success", autoShow: true },
  order_confirmed: { title: "Order Confirmed", icon: "✅", color: "success", autoShow: true },
  order_status_updated: { title: "Status Updated", icon: "📦", color: "info", autoShow: false },
  order_shipped: { title: "Order Shipped", icon: "🚚", color: "info", autoShow: true },
  order_delivered: { title: "Order Delivered", icon: "✅", color: "success", autoShow: true },
  order_cancelled: { title: "Order Cancelled", icon: "❌", color: "warning", autoShow: true },
  new_user: { title: "New User!", icon: "👤", color: "success", autoShow: false },
  low_stock: { title: "Low Stock Alert", icon: "⚠️", color: "warning", autoShow: true },
  courier_update: { title: "Courier Update", icon: "📍", color: "info", autoShow: false },
};

// ── Context ────────────────────────────────────────────────────────────────────

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function RealtimeProvider({
  children,
  storeId,
}: {
  children: ReactNode;
  storeId?: string;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const actualStoreId = storeId || user?.storeId || "default";

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/socket.io/?EIO=4&transport=websocket`;

    try {
      // For Socket.io, we use the socket.io client
      // This is a simplified WebSocket implementation
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[Realtime] Connected");
        setIsConnected(true);
        setConnectionStatus("connected");

        // Join store room
        socket.send(JSON.stringify({ event: "join_store", data: actualStoreId }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle order events
          if (data.type && data.orderId) {
            const realtimeEvent: RealtimeEvent = {
              id: data.id || `evt_${Date.now()}`,
              type: data.type,
              orderId: data.orderId,
              storeId: data.storeId || actualStoreId,
              message: data.message || getEventMessage(data.type),
              timestamp: data.timestamp || Date.now(),
              data: data.metadata || data,
            };

            // Add to events list
            setEvents((prev) => [realtimeEvent, ...prev.slice(0, 49)]);
            setLastEvent(realtimeEvent);

            // Auto-show notification
            const eventType = data.type as EventType;
            const config = EVENT_CONFIG[eventType];
            if (config?.autoShow) {
              toast[config.color as "success" | "error" | "warning" | "info"](realtimeEvent.message, config.title);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      socket.onclose = () => {
        console.log("[Realtime] Disconnected");
        setIsConnected(false);
        setConnectionStatus("disconnected");

        // Auto-reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      socket.onerror = (error) => {
        console.error("[Realtime] Error:", error);
        setConnectionStatus("error");
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("[Realtime] Connection error:", error);
      setConnectionStatus("error");
    }
  }, [actualStoreId, toast]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    socketRef.current?.close();
    connect();
  }, [connect]);

  // Connect on mount
  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [user, connect]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        events,
        connectionStatus,
        reconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider");
  }
  return context;
}

// ── Helper Functions ───────────────────────────────────────────────────────────

function getEventMessage(type: EventType): string {
  const messages: Record<EventType, string> = {
    order_created: "New order received!",
    order_confirmed: "Order has been confirmed.",
    order_status_updated: "Order status has changed.",
    order_shipped: "Order has been shipped.",
    order_delivered: "Order has been delivered!",
    order_cancelled: "Order has been cancelled.",
    new_user: "New user registered.",
    low_stock: "Product is running low on stock.",
    courier_update: "Courier status updated.",
  };
  return messages[type] || "Event received.";
}

// ── Real-time Event Listener Hook ──────────────────────────────────────────────

export function useRealtimeEvent(
  eventType: EventType,
  callback: (event: RealtimeEvent) => void
) {
  const { lastEvent } = useRealtime();

  useEffect(() => {
    if (lastEvent && lastEvent.type === eventType) {
      callback(lastEvent);
    }
  }, [lastEvent, eventType, callback]);
}

// ── Order Event Specific Hook ───────────────────────────────────────────────────

export function useOrderRealtime(onOrderUpdate?: (event: RealtimeEvent) => void) {
  const { lastEvent, isConnected } = useRealtime();

  useEffect(() => {
    if (lastEvent && lastEvent.orderId && onOrderUpdate) {
      onOrderUpdate(lastEvent);
    }
  }, [lastEvent, onOrderUpdate]);

  return { isConnected, lastEvent };
}

// ── Polling Fallback (if WebSocket fails) ─────────────────────────────────────

export function usePollingFallback(
  fetchFn: () => Promise<void>,
  interval = 30000
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchFn();

    // Set up polling
    intervalRef.current = setInterval(fetchFn, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchFn, interval]);
}

// ── Notification Sound ─────────────────────────────────────────────────────────

let audioContext: AudioContext | null = null;

export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch {
    // Ignore audio errors
  }
}