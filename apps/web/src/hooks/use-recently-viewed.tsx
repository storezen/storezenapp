import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const LS_KEY  = 'pk-recently-viewed';
const MAX_IDS = 10;

type RecentlyViewedCtx = {
  ids:        string[];
  trackView:  (id: string) => void;
  clearAll:   () => void;
};

const Ctx = createContext<RecentlyViewedCtx | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  }, [ids]);

  const trackView = useCallback((id: string) => {
    setIds(prev => {
      const filtered = prev.filter(i => i !== id);
      return [id, ...filtered].slice(0, MAX_IDS);
    });
  }, []);

  const clearAll = useCallback(() => setIds([]), []);

  return (
    <Ctx.Provider value={{ ids, trackView, clearAll }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRecentlyViewed(): RecentlyViewedCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
