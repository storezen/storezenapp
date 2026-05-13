"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Star,
  ChevronRight,
  Shield,
  Truck,
  Headphones,
  RefreshCcw,
  Zap,
  Award,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Package,
  Clock,
  TrendingUp,
  LayoutGrid,
  Image,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { CollectionShowcase } from "./CollectionShowcase";
import { usePublicCatalog } from "@/hooks/use-products";
import { type PublicProductSort, listPublicCollections } from "@/services/catalog.service";
import { cn } from "@/lib/utils";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

const TRUST_ITEMS = [
  { icon: Truck, label: "Free Delivery", sub: "On orders over Rs. 2,000" },
  { icon: Shield, label: "COD Available", sub: "Pay on delivery" },
  { icon: RefreshCcw, label: "Easy Returns", sub: "7-day return policy" },
  { icon: Headphones, label: "WhatsApp Support", sub: "Quick response" },
];

const TESTIMONIALS = [
  {
    name: "Ayesha K.",
    city: "Karachi",
    text: "Best smartwatch I have ever owned. Delivery was super fast — got it in 2 days!",
    rating: 5,
    product: "SmartWatch Pro X",
  },
  {
    name: "Hamza R.",
    city: "Lahore",
    text: "Amazing quality for the price. The earbuds sound incredible. WhatsApp support was very helpful.",
    rating: 5,
    product: "AirBuds Ultra",
  },
  {
    name: "Sara M.",
    city: "Islamabad",
    text: "I ordered as a gift for my brother. Premium packaging, genuine product. Will order again!",
    rating: 5,
    product: "SmartBand Elite",
  },
];

const FLASH_DEALS = [
  { name: "SmartWatch Pro X", price: 4999, oldPrice: 7999, tag: "-37%", badge: "Best Seller" },
  { name: "AirBuds Ultra", price: 2999, oldPrice: 4999, tag: "-40%", badge: "Hot Deal" },
  { name: "PowerBank 20K", price: 1999, oldPrice: 3499, tag: "-43%", badge: "Limited" },
  { name: "Car Charger Dual", price: 899, oldPrice: 1499, tag: "-40%", badge: "Flash" },
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString() + suffix);
  const [display, setDisplay] = useState("0" + suffix);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.8, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <span>{display}</span>;
}

export function PremiumHomePage() {
  const STORE_SLUG = typeof window !== "undefined" ? (document.location.host.split(".")[0] || "demo") : "demo";

  // For SSR, use the env variable
  const storeSlug = typeof window !== "undefined" ? STORE_SLUG : (process.env.NEXT_PUBLIC_STORE_SLUG || "demo");

  // Fetch all products
  const { products, isLoading } = usePublicCatalog({ collectionId: null, q: "", sort: "newest" as PublicProductSort, limit: 50, enabled: true });
  const [currentDeal, setCurrentDeal] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Fetch collections from API (same as admin dropdown)
  useEffect(() => {
    listPublicCollections(STORE_SLUG)
      .then((data) => setCollections(data.slice(0, 6)))
      .catch(() => setCollections([]));
  }, []);

  // Map collections to show products - with fallback to product categories
  let collectionsWithProducts: { id: string; name: string; slug: string; products: typeof products }[] = [];

  if (collections.length > 0) {
    // Use collections from API
    collectionsWithProducts = collections.map((col) => ({
      ...col,
      products: (products ?? []).filter((p) => {
        const productCollections = p.collection_ids ?? [];
        if (productCollections.includes(col.id)) return true;
        const catSlug = col.slug.replace(/-/g, " ").toLowerCase();
        return (p.category ?? "").toLowerCase().includes(catSlug);
      }).slice(0, 4),
    })).filter((c) => c.products.length > 0);
  } else if (products && products.length > 0) {
    // Fallback: extract categories from products
    const categories = [...new Set((products ?? []).map((p) => p.category).filter(Boolean))] as string[];
    collectionsWithProducts = categories.slice(0, 4).map((cat) => ({
      id: cat,
      name: cat,
      slug: cat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      products: (products ?? []).filter((p) => p.category === cat).slice(0, 4),
    }));
  }

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDeal((c) => (c + 1) % FLASH_DEALS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      {/* Hero Section - Full width background, contained content */}
      <section className="relative min-h-[85vh] overflow-hidden bg-zinc-950">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(16,185,129,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Floating elements */}
        <motion.div
          className="absolute left-[15%] top-[25%] h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-[20%] top-[40%] h-80 w-80 rounded-full bg-blue-500/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Content - inside shop-container */}
        <div className="shop-container relative z-10 flex min-h-[85vh] items-center">
          <div className="grid w-full grid-cols-1 gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-0">
            {/* Left - Text */}
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: heroLoaded ? 1 : 0, y: heroLoaded ? 0 : 20 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold tracking-wide text-emerald-400">
                    NEW COLLECTION 2025
                  </span>
                </div>

                <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                  Premium
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                    Tech Gear
                  </span>
                  <br />
                  for Every Day
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-zinc-400">
                  Discover our curated collection of smartwatches, earbuds, and accessories.
                  Premium quality, unbeatable prices, delivered to your doorstep.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link href="/products">
                    <Button size="xl" variant="accent" className="gap-2 shadow-lg shadow-emerald-500/20">
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/track">
                    <Button size="xl" variant="ghost" className="gap-2 text-white hover:bg-white/10">
                      Track Order
                    </Button>
                  </Link>
                </div>

                {/* Mini stats */}
                <div className="flex items-center gap-8 pt-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white"><AnimatedCounter value={50} suffix="K+" /></p>
                    <p className="text-[10px] text-zinc-500">Happy Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white"><AnimatedCounter value={500} suffix="+" /></p>
                    <p className="text-[10px] text-zinc-500">Premium Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">4.8★</p>
                    <p className="text-[10px] text-zinc-500">Average Rating</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right - Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: heroLoaded ? 1 : 0, scale: heroLoaded ? 1 : 0.95 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden items-center justify-center lg:flex"
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <img
                  src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=85"
                  alt="Premium smartwatch collection"
                  className="relative z-10 max-h-[520px] animate-float rounded-3xl object-cover shadow-2xl"
                />
                {/* Floating card - Flash Sale */}
                <motion.div
                  className="absolute -bottom-6 -left-6 z-20 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: heroLoaded ? 1 : 0, x: heroLoaded ? 0 : -20 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                      <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Flash Sale</p>
                      <p className="text-sm font-bold text-white">Up to 40% Off</p>
                    </div>
                  </div>
                </motion.div>
                {/* Rating card */}
                <motion.div
                  className="absolute -top-4 -right-4 z-20 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 backdrop-blur-xl"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: heroLoaded ? 1 : 0, x: heroLoaded ? 0 : 20 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-white">4.9</span>
                    <span className="text-xs text-zinc-400">/ 5</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-500">2,400+ reviews</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/20 pt-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* Trust Badges - Responsive */}
      <section className="border-b border-zinc-100 bg-white py-6 md:py-10">
        <div className="shop-container">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 sm:bg-transparent sm:p-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:h-10 sm:w-10 sm:rounded-xl">
                  <item.icon className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 sm:text-sm">{item.label}</p>
                  <p className="text-[10px] text-zinc-500 sm:text-[11px]">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories - 4 Category Cards */}
      <section className="section-box bg-white">
        <div className="shop-container">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Shop by Category</h2>
            <p className="mt-1 text-sm text-zinc-500">Find exactly what you need</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { name: "Smartwatches", slug: "smart-watches", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" },
              { name: "Earbuds", slug: "earbuds", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80" },
              { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d6f46?w=600&q=80" },
              { name: "Audio", slug: "audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
            ].map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Link href={`/category/${cat.slug}`}>
                  <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <h3 className="text-base font-bold text-white">{cat.name}</h3>
                      <p className="mt-0.5 text-xs text-white/70">Shop Now</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Deals - Gray section */}
      <section className="section-box--sm bg-zinc-50">
        <div className="shop-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow-sm shadow-red-500/20">
                <Zap className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Flash Deals</h2>
                <p className="text-sm text-zinc-500">Limited time offers — ends soon!</p>
              </div>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="card-grid mt-8">
            {FLASH_DEALS.map((deal, i) => (
              <motion.div
                key={deal.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={cn(
                  "flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                  i === currentDeal && "ring-2 ring-emerald-500/60 ring-offset-2",
                )}
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-50">
                  <img
                    src={`https://images.unsplash.com/photo-${i === 0 ? "1523275335684-37898b6baf30" : i === 1 ? "1590658268037-6bf12165a8df" : i === 2 ? "1517190406520-d2b3c6ee4c94" : "1509391366360-2e959784a5c3"}?w=300&q=80`}
                    alt={deal.name}
                    className="h-full w-full object-cover"
                  />
                  <Badge variant="sale" className="absolute left-2 top-2">
                    {deal.badge}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-1 flex-col space-y-1">
                  <p className="text-sm font-medium text-zinc-900 line-clamp-1">{deal.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-zinc-900">Rs. {deal.price.toLocaleString()}</span>
                    <span className="text-xs text-zinc-400 line-through">Rs. {deal.oldPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={cn("h-3 w-3", si < 4 ? "fill-amber-400 text-amber-400" : "text-zinc-200")} />
                    ))}
                    <span className="text-[10px] text-zinc-500">(128)</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Collection Showcase - Same as navbar categories */}
      <CollectionShowcase introTitle="Shop by Category" introSubtitle="Latest products in each category" productsPerCollection={4} />

      {/* Why Choose Us - White section, 3-column grid */}
      <section className="section-box bg-white">
        <div className="shop-container">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Why Vendrix?</h2>
              <p className="mt-2 text-sm text-zinc-500">We are obsessed with making your shopping experience amazing</p>
            </motion.div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              { icon: Package, title: "Premium Packaging", desc: "Every order arrives in beautifully designed packaging that makes unboxing feel special." },
              { icon: Shield, title: "Genuine Products", desc: "We only sell 100% authentic products with proper warranty coverage." },
              { icon: Clock, title: "Fast Delivery", desc: "Get your order in 2-5 business days across 100+ cities in Pakistan." },
              { icon: MessageCircle, title: "WhatsApp Support", desc: "Need help? Message us on WhatsApp and get instant, friendly support." },
              { icon: RefreshCcw, title: "Easy Returns", desc: "Not happy? Return within 7 days — no questions asked, full refund." },
              { icon: Award, title: "Best Prices", desc: "We cut the middleman to bring you premium products at honest prices." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group flex gap-4 rounded-2xl border border-zinc-100 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                  <item.icon className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Dark section */}
      <section className="section-box relative overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.06),transparent_50%)]" />
        <div className="shop-container relative">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">What Our Customers Say</h2>
              <p className="mt-2 text-sm text-zinc-400">Join 50,000+ happy customers across Pakistan</p>
            </motion.div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/70"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-zinc-300">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.city} · {t.product}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Emerald gradient */}
      <section className="section-box relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="shop-container relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
              <span className="text-[11px] font-medium text-white/90">WhatsApp Available</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Got Questions?</h2>
            <p className="mx-auto mt-3 max-w-md text-white/85">
              Our team is ready to help you on WhatsApp. Get instant support, product recommendations, and order tracking.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="gap-2 shadow-lg shadow-black/10">
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="ghost" className="gap-2 border border-white/20 text-white hover:bg-white/10 hover:text-white">
                  Continue Shopping <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

          </div>
  );
}