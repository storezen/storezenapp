"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteChrome } from "@/components/SiteChrome";
import { GlobalLoadingOverlay } from "@/components/ui/notifications/loading-states";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Don't wrap account pages with SiteChrome
  if (pathname.startsWith("/account")) {
    return (
      <>
        {children}
        <GlobalLoadingOverlay />
      </>
    );
  }

  return (
    <SiteChrome>{children}</SiteChrome>
  );
}
