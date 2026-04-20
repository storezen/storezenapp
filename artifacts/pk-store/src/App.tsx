import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PageLoader } from "@/components/SkeletonCard";
import { initPixel, trackPageView } from "@/lib/tiktok-pixel";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { RecentlyViewedProvider } from "@/hooks/use-recently-viewed";

/* ── Code-split page imports ────────────────────────────────────────────────── */
const Home              = lazy(() => import("@/pages/Home"));
const ProductDetail     = lazy(() => import("@/pages/ProductDetail"));
const Cart              = lazy(() => import("@/pages/Cart"));
const Catalog           = lazy(() => import("@/pages/Catalog"));
const Contact           = lazy(() => import("@/pages/Contact"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const TrackOrder        = lazy(() => import("@/pages/TrackOrder"));
const Wishlist          = lazy(() => import("@/pages/Wishlist"));
const ReturnPolicy      = lazy(() => import("@/pages/ReturnPolicy"));
const NotFound          = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient();

function RouteTracker() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView();
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/"            component={Home} />
        <Route path="/catalog"     component={Catalog} />
        <Route path="/contact"     component={Contact} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/cart"               component={Cart} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/track-order"        component={TrackOrder} />
        <Route path="/wishlist"           component={Wishlist} />
        <Route path="/return-policy"      component={ReturnPolicy} />
        <Route                            component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    initPixel();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WishlistProvider>
        <RecentlyViewedProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <RouteTracker />
            <Router />
          </WouterRouter>
          <WhatsAppButton />
          <InstallPrompt />
          <Toaster />
        </TooltipProvider>
        </RecentlyViewedProvider>
      </WishlistProvider>
    </QueryClientProvider>
  );
}

export default App;
