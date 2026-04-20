import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { PageLoader } from "@/components/SkeletonCard";
import { initPixel, trackPageView } from "@/lib/tiktok-pixel";

/* ── Code-split page imports ────────────────────────────────────────────────── */
const Home          = lazy(() => import("@/pages/Home"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart          = lazy(() => import("@/pages/Cart"));
const Catalog       = lazy(() => import("@/pages/Catalog"));
const Contact       = lazy(() => import("@/pages/Contact"));
const NotFound      = lazy(() => import("@/pages/not-found"));

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
        <Route path="/cart"        component={Cart} />
        <Route                     component={NotFound} />
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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <RouteTracker />
          <Router />
        </WouterRouter>
        <WhatsAppButton />
        <InstallPrompt />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
