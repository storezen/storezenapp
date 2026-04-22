import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return {
    store: ctx.store,
    isLoading: ctx.isLoading,
    error: ctx.error,
    storeSlug: ctx.storeSlug,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeSlug = useStoreSlug();
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeNotFound, setStoreNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setIsLoading(true);
      setError(null);
      setStoreNotFound(false);
      try {
        const resp = await fetch(`${API_URL}/stores/${encodeURIComponent(storeSlug)}`);
        const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
        if (resp.status === 404) {
          if (mounted) {
            setStore(null);
            setError("Store not found (404).");
            setStoreNotFound(true);
          }
          return;
        }
        if (!resp.ok) {
          const msg =
            typeof data?.error === "string" ? data.error : "Failed to load store";
          throw new Error(msg);
        }
        if (mounted) setStore(data as StoreData);
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

  if (!isLoading && storeNotFound) {
    return (
      <StoreContext.Provider value={value}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>404</h1>
            <p style={{ color: "#555", maxWidth: "28rem" }}>{error}</p>
          </div>
        </div>
      </StoreContext.Provider>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
