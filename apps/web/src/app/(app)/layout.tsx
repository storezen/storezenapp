import type { ReactNode } from "react";

/**
 * App shell route group: children inherit only from root `app/layout`.
 * Per-area chrome lives in `(store)/layout` and `(admin)/layout`.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return children;
}
