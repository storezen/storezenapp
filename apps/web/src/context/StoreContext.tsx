import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { API_URL } from "@/config";
import { useStoreSlug } from "@/hooks/use-store-slug";

type StoreData = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  theme?: string | null;
  themeColors?: unknown;
  tiktokPixel?: string | null;
  whatsappNumber?: string | null;
  deliverySettings?: unknown;
  paymentMethods?: unknown;
  isActive?: boolean;
};

type StoreContextValue = {
  store: StoreData | null;
  isLoading: boolean;
  error: string | null;
  storeSlug: string;
};

export const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeSlug = useStoreSlug();
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_URL}/stores/${encodeURIComponent(storeSlug)}`);
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error ?? "Failed to load store");
        if (mounted) setStore(data);
      } catch (err) {
        if (mounted) {
          setStore(null);
          setError(err instanceof Error ? err.message : "Failed to load store");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [storeSlug]);

  const value = useMemo(
    () => ({
      store,
      isLoading,
      error,
      storeSlug,
    }),
    [store, isLoading, error, storeSlug],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
