"use client";

import { useMemo, useState } from "react";
import { WHATSAPP } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { CartDrawer } from "@/components/CartDrawer";

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

      {WHATSAPP ? (
        <a
          href={`https://wa.me/${WHATSAPP}`}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-2xl text-white shadow-lg animate-pulseSoft md:bottom-4"
          aria-label="WhatsApp support"
        >
          ✆
        </a>
      ) : null}

      <MobileNav cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
