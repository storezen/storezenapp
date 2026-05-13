"use client";

import { useState } from "react";
import { PublicStoreProvider } from "@/contexts/PublicStoreContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { CartDrawer } from "@/components/CartDrawer";
import { StorePixels } from "@/components/StorePixels";
import { VisitorTracker } from "@/components/VisitorTracker";
import { useAutoEventTracker } from "@/hooks/use-event-tracker";

function AutoTracker() {
  useAutoEventTracker();
  return null;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <PublicStoreProvider>
      <StorePixels />
      <VisitorTracker />
      <AutoTracker />
      <Navbar />
      <main className="shop-container min-h-[75vh] pb-8">{children}</main>
      <Footer />

      <MobileNav />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </PublicStoreProvider>
  );
}
