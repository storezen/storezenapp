"use client";

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModalType = "confirm" | "error" | "warning" | "success" | "info" | "loading";

export interface ModalConfig {
  id?: string;
  type: ModalType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  closable?: boolean;
  persistent?: boolean;
  icon?: "warning" | "error" | "success" | "info" | "alert";
}

interface ModalContextValue {
  modals: ModalConfig[];
  openModal: (config: ModalConfig) => string;
  closeModal: (id?: string) => void;
  closeAll: () => void;

  // Convenience methods
  confirm: (message: string, onConfirm: () => void | Promise<void>, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  loading: (message: string, title?: string) => void;
}

const ICON_MAP = {
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
  info: Info,
  alert: AlertCircle,
};

const COLORS = {
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-500" },
  error: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-500" },
  alert: { bg: "bg-zinc-50", border: "border-zinc-200", icon: "text-zinc-500" },
};

// ── Modal Component ────────────────────────────────────────────────────────────

function ModalItem({
  config,
  onClose,
}: {
  config: ModalConfig;
  onClose: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!config.onConfirm) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await config.onConfirm();
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    config.onCancel?.();
    if (!config.persistent) {
      onClose();
    }
  };

  const handleBackdropClick = () => {
    if (!config.persistent && config.closable !== false) {
      handleCancel();
    }
  };

  const Icon = ICON_MAP[config.icon || (config.type === "confirm" ? "warning" : config.type === "error" ? "error" : config.type === "success" ? "success" : config.type === "warning" ? "warning" : "info")];
  const colors = COLORS[config.icon || (config.type === "confirm" ? "warning" : config.type === "error" ? "error" : config.type === "success" ? "success" : config.type === "warning" ? "warning" : "info")];

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden",
          "transform transition-all duration-300 scale-100",
          config.type === "loading" ? "border border-zinc-200" : "border"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {config.type !== "loading" && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        )}

        <div className={cn("p-6", config.type === "loading" && "flex items-center gap-4")}>
          {/* Loading State */}
          {config.type === "loading" && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Processing...</p>
                <p className="text-sm text-zinc-500 mt-1">{config.message}</p>
              </div>
            </>
          )}

          {/* Icon + Content */}
          {config.type !== "loading" && (
            <>
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", colors.bg)}>
                <Icon className={cn("h-6 w-6", colors.icon)} />
              </div>

              <div>
                {config.title && (
                  <h3 className="text-lg font-bold text-zinc-900">{config.title}</h3>
                )}
                <p className={cn("mt-2 text-zinc-600", config.title ? "text-sm" : "text-base font-medium")}>
                  {config.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                {config.type !== "success" && config.type !== "error" && (
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    {config.cancelText || "Cancel"}
                  </Button>
                )}
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  loading={isLoading}
                  className={cn(
                    config.type === "error" && "bg-red-500 hover:bg-red-600",
                    config.type === "confirm" && "",
                    config.type === "success" && "bg-emerald-500 hover:bg-emerald-600",
                    config.type === "warning" && "bg-amber-500 hover:bg-amber-600"
                  )}
                >
                  {config.confirmText || "Confirm"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Container ────────────────────────────────────────────────────────────

function ModalContainer({
  modals,
  onClose,
}: {
  modals: ModalConfig[];
  onClose: (id?: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || modals.length === 0) return null;

  return createPortal(
    <>
      {modals.map((modal) => (
        <ModalItem
          key={modal.id}
          config={modal}
          onClose={() => onClose(modal.id)}
        />
      ))}
    </>,
    document.body
  );
}

// ── Context ────────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((config: ModalConfig) => {
    const id = config.id || `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setModals((prev) => [...prev, { ...config, id }]);
    return id;
  }, []);

  const closeModal = useCallback((id?: string) => {
    if (id) {
      setModals((prev) => prev.filter((m) => m.id !== id));
    } else {
      // Close last modal
      setModals((prev) => prev.slice(0, -1));
    }
  }, []);

  const closeAll = useCallback(() => {
    setModals([]);
  }, []);

  // Convenience methods
  const confirm = useCallback(
    (message: string, onConfirm: () => void | Promise<void>, title?: string) => {
      openModal({ type: "confirm", message, onConfirm, title: title || "Confirm Action" });
    },
    [openModal]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      openModal({ type: "error", message, title: title || "Error" });
    },
    [openModal]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      openModal({ type: "warning", message, title: title || "Warning" });
    },
    [openModal]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      openModal({ type: "success", message, title: title || "Success" });
    },
    [openModal]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      openModal({ type: "info", message, title: title || "Info" });
    },
    [openModal]
  );

  const loading = useCallback(
    (message: string, title?: string) => {
      openModal({ type: "loading", message, title: title || "Processing", persistent: true });
    },
    [openModal]
  );

  return (
    <ModalContext.Provider
      value={{
        modals,
        openModal,
        closeModal,
        closeAll,
        confirm,
        error,
        warning,
        success,
        info,
        loading,
      }}
    >
      {children}
      <ModalContainer modals={modals} onClose={closeModal} />
    </ModalContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}

// ── Preset Confirm Actions ─────────────────────────────────────────────────────

export function useConfirmModal() {
  const { confirm } = useModal();

  return {
    // Delete actions
    deleteProduct: (onConfirm: () => void) =>
      confirm("Are you sure you want to delete this product? This action cannot be undone.", onConfirm, "Delete Product"),

    deleteOrder: (onConfirm: () => void) =>
      confirm("Are you sure you want to delete this order?", onConfirm, "Delete Order"),

    deleteCustomer: (onConfirm: () => void) =>
      confirm("This will remove all order history. Continue?", onConfirm, "Delete Customer"),

    // Cancel actions
    cancelOrder: (onConfirm: () => void) =>
      confirm("Cancel this order? The customer will be notified.", onConfirm, "Cancel Order"),

    cancelSubscription: (onConfirm: () => void) =>
      confirm("This will end your subscription. Continue?", onConfirm, "Cancel Subscription"),

    // Status changes
    changeOrderStatus: (onConfirm: () => void) =>
      confirm("Update order status? Customer will receive notification.", onConfirm, "Update Status"),

    // Dangerous admin actions
    deleteStore: (onConfirm: () => void) =>
      confirm("This will permanently delete the store and all data. Continue?", onConfirm, "Delete Store"),

    removeAdmin: (onConfirm: () => void) =>
      confirm("Remove this admin's access? They will be logged out.", onConfirm, "Remove Admin"),

    // General
    confirm: (message: string, onConfirm: () => void, title?: string) =>
      confirm(message, onConfirm, title),
  };
}