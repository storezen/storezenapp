"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { NotificationProvider } from "@/components/ui/notifications/toast-system";
import { ModalProvider } from "@/components/ui/notifications/modal-system";
import { LoadingProvider } from "@/components/ui/notifications/loading-states";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <ModalProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ModalProvider>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
