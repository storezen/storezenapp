"use client";

import { useEffect, useRef } from "react";
import { setStoreAnalyticsFlags } from "@/lib/analytics";
import { usePublicStore } from "@/contexts/PublicStoreContext";

type Fbq = ((...a: unknown[]) => void) & { push: unknown; loaded?: boolean; version?: string; queue: unknown[] };
type Ttq = { load: (id: string) => void; page: () => void; _i?: Record<string, unknown> };

/**
 * Syncs `themeColors.analytics` into client event flags on every store update (e.g. after dashboard save + refetch).
 * Loads Meta / TikTok from the store when env pixel IDs are not set; re-inits when store pixel IDs change.
 * Uses a single public-store load via `PublicStoreProvider` (no duplicate fetches).
 */
function effectivePixelKey(store: { id: string; metaPixel?: string | null; tiktokPixel?: string | null } | null) {
  if (!store) return "";
  return [
    store.id,
    process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
    process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "",
    store.metaPixel ?? "",
    store.tiktokPixel ?? "",
  ].join("\0");
}

export function StorePixels() {
  const { store, loading, error } = usePublicStore();
  const lastPixelKey = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !store || error) return;
    const tc = store.themeColors && typeof store.themeColors === "object" ? (store.themeColors as Record<string, unknown>) : null;
    setStoreAnalyticsFlags(tc?.analytics);
  }, [store, loading, error]);

  useEffect(() => {
    if (loading || !store) return;
    if (error) return;
    const key = effectivePixelKey(store);
    if (key && lastPixelKey.current === key) return;
    lastPixelKey.current = key;

    if (!process.env.NEXT_PUBLIC_META_PIXEL_ID && store.metaPixel) {
      const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
      if (!w.fbq) {
        const t = document.createElement("script");
        t.textContent = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(store.metaPixel)});fbq('track', 'PageView');
`;
        document.head.appendChild(t);
      } else {
        w.fbq("init", store.metaPixel);
        w.fbq("track", "PageView");
      }
    }

    if (!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID && store.tiktokPixel) {
      const w = window as unknown as { ttq?: Ttq };
      if (!w.ttq) {
        const script = document.createElement("script");
        const id = store.tiktokPixel;
        script.textContent = `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};
  ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
  ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");
  n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
  e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${id.replace(/'/g, "")}');ttq.page();
}(window, document, 'ttq');
`;
        document.head.appendChild(script);
      } else if (!w.ttq._i?.[store.tiktokPixel]) {
        w.ttq.load(store.tiktokPixel);
        w.ttq.page();
      }
    }
  }, [store, loading, error]);

  return null;
}
