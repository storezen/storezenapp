"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "";

type EventCallback = (data: unknown) => void;

export function useSocket(storeId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!storeId) return;

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_store", storeId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [storeId]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    socketRef.current?.on(event, callback);
    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}

// Auto heartbeat hook
export function useHeartbeat(storeId?: string, sessionId?: string, interval = 10000) {
  const { emit, connected } = useSocket(storeId);

  useEffect(() => {
    if (!connected || !storeId || !sessionId) return;

    const heartbeat = () => {
      emit("heartbeat", { storeId, sessionId });
    };

    heartbeat();
    const intervalId = setInterval(heartbeat, interval);

    return () => clearInterval(intervalId);
  }, [connected, storeId, sessionId, interval, emit]);
}