"use client";

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;

  // Convenience methods
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  loading: (message: string, title?: string) => void;

  // WebSocket integration
  trigger: (notification: Omit<Notification, "id">) => void;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const ICONS: Record<NotificationType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

const COLORS: Record<NotificationType, { bg: string; border: string; icon: string; progress: string }> = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500", progress: "bg-emerald-500" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500", progress: "bg-red-500" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500", progress: "bg-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500", progress: "bg-blue-500" },
  loading: { bg: "bg-zinc-50", border: "border-zinc-200", icon: "text-zinc-500", progress: "bg-zinc-500" },
};

// ── Toast Component ────────────────────────────────────────────────────────────

function ToastItem({
  notification,
  onRemove,
}: {
  notification: Notification;
  onRemove: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification.type === "loading" || notification.duration === 0) return;

    const duration = notification.duration || 4000;
    const interval = 50;
    const step = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification.duration, notification.type]);

  useEffect(() => {
    if (notification.type !== "loading" && (notification.duration !== 0)) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
      }, notification.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const Icon = ICONS[notification.type];
  const colors = COLORS[notification.type];

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      className={cn(
        "relative w-80 bg-white rounded-xl border shadow-lg overflow-hidden",
        "transform transition-all duration-300 ease-out",
        "hover:shadow-xl hover:-translate-y-0.5",
        isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0",
        colors.border
      )}
    >
      {/* Progress Bar */}
      {notification.type !== "loading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100">
          <div
            className={cn("h-full transition-all duration-50 ease-linear", colors.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0", colors.icon)}>
            {notification.type === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className="font-semibold text-zinc-900 text-sm">{notification.title}</p>
            )}
            <p className={cn("text-sm text-zinc-600", notification.title && "mt-1")}>
              {notification.message}
            </p>

            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Container ──────────────────────────────────────────────────────────────────

function ToastContainer({
  notifications,
  onRemove,
}: {
  notifications: Notification[];
  onRemove: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-h-screen overflow-hidden pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <ToastItem
            notification={notification}
            onRemove={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Context ────────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, title?: string) => {
    addNotification({ type: "success", message, title });
  }, [addNotification]);

  const error = useCallback((message: string, title?: string) => {
    addNotification({ type: "error", message, title, duration: 6000 });
  }, [addNotification]);

  const warning = useCallback((message: string, title?: string) => {
    addNotification({ type: "warning", message, title });
  }, [addNotification]);

  const info = useCallback((message: string, title?: string) => {
    addNotification({ type: "info", message, title });
  }, [addNotification]);

  const loading = useCallback((message: string, title?: string) => {
    return addNotification({ type: "loading", message, title, duration: 0 });
  }, [addNotification]);

  // For real-time triggers
  const trigger = addNotification;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
        loading,
        trigger,
      }}
    >
      {children}
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

// ── Preset Functions ───────────────────────────────────────────────────────────

export function useToast() {
  const { success, error, warning, info, loading, removeNotification, addNotification } = useNotification();

  return {
    // Basic
    success,
    error,
    warning,
    info,
    loading,
    dismiss: removeNotification,

    // Presets
    orderPlaced: (orderId: string) =>
      success(`Order #${orderId.slice(-6)} placed successfully!`),

    orderUpdated: (status: string) =>
      success(`Order ${status}. Updated successfully.`),

    orderCancelled: () =>
      warning("Order has been cancelled."),

    productAdded: () =>
      success("Product added to cart!"),

    productRemoved: () =>
      info("Product removed from cart."),

    saveSuccess: () =>
      success("Changes saved successfully."),

    deleteSuccess: () =>
      success("Item deleted successfully."),

    copySuccess: () =>
      info("Copied to clipboard!"),

    // With action
    withAction: (notification: Omit<Notification, "id">) =>
      addNotification(notification),
  };
}

// ── Global Notification Trigger (for WebSocket) ───────────────────────────────

let globalNotifier: ((notification: Omit<Notification, "id">) => void) | null = null;

export function setGlobalNotifier(notifier: (notification: Omit<Notification, "id">) => void) {
  globalNotifier = notifier;
}

export function showGlobalNotification(notification: Omit<Notification, "id">) {
  if (globalNotifier) {
    globalNotifier(notification);
  }
}

// Trigger from outside React
export function triggerNotification(notification: Omit<Notification, "id">) {
  showGlobalNotification(notification);
}