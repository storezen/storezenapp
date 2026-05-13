"use client";

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react";

const FEED_MAX = 25;

type Toast = { id: number; message: string };
export type ActivityItem = { id: string; message: string; t: number };

type Ctx = {
  toasts: Toast[];
  /** Recent confirmations for the updates bell (persists in memory this session) */
  activityFeed: ActivityItem[];
  quickSettingsOpen: boolean;
  setQuickSettingsOpen: Dispatch<SetStateAction<boolean>>;
  notifOpen: boolean;
  setNotifOpen: Dispatch<SetStateAction<boolean>>;
  /** Mobile hamburger → left drawer */
  mobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  pushToast: (message: string) => void;
  dismiss: (id: number) => void;
};

const AdminUIContext = createContext<Ctx | null>(null);

function feedId() {
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AdminUIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pushToast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setActivityFeed((f) => [{ id: feedId(), message, t: Date.now() }, ...f].slice(0, FEED_MAX));
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      toasts,
      activityFeed,
      quickSettingsOpen,
      setQuickSettingsOpen,
      notifOpen,
      setNotifOpen,
      mobileMenuOpen,
      setMobileMenuOpen,
      pushToast,
      dismiss,
    }),
    [toasts, activityFeed, quickSettingsOpen, notifOpen, mobileMenuOpen, pushToast, dismiss],
  );

  return <AdminUIContext.Provider value={value}>{children}</AdminUIContext.Provider>;
}

export function useAdminUI() {
  const c = useContext(AdminUIContext);
  if (!c) throw new Error("useAdminUI must be used within AdminUIProvider");
  return c;
}

export function useOptionalAdminUI() {
  return useContext(AdminUIContext);
}
