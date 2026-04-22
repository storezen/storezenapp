"use client";

import { useMemo, useState } from "react";
import { WHATSAPP } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { CartDrawer } from "@/components/CartDrawer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  return (
    <>
      <AnnouncementBar />
      <Navbar cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <main className="shop-container min-h-[75vh] py-6 md:py-8 safe-bottom">{children}</main>
      <Footer />

      {WHATSAPP ? <WhatsAppButton /> : null}

      <MobileNav cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
