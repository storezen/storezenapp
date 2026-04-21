import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Truck, ShieldCheck, Tag, ArrowRight, RotateCcw, Shirt, Monitor, Sparkles } from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
import { CountdownTimer } from '../components/CountdownTimer';
import { StoreLogo } from '../components/StoreLogo';
import { STORE_CONFIG } from '../config';
import { trackClickButton, trackPageView } from '../lib/tiktok-pixel';
import { useSeo } from '../hooks/useSeo';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { useStore } from '../hooks/use-store';

const categories = ['All', 'Clothing', 'Digital', 'Beauty'];

const categoryCards = [
  {
    name: 'Clothing',
    label: 'Fashion & Apparel',
    description: 'T-shirts, hoodies & more',
    Icon: Shirt,
  },
  {
    name: 'Digital',
    label: 'Digital Products',
    description: 'eBooks, guides & tools',
    Icon: Monitor,
  },
  {
    name: 'Beauty',
    label: 'Beauty & Fragrance',
    description: 'Perfumes & cosmetics',
    Icon: Sparkles,
  },
];

const trustItems = [
  { icon: Truck,       label: 'Fast Delivery',    sub: '2-4 working days'   },
  { icon: ShieldCheck, label: '100% Authentic',   sub: 'Quality guaranteed' },
  { icon: Tag,         label: 'Best Prices',      sub: 'Unbeatable deals'   },
  { icon: RotateCcw,   label: 'Easy Returns',     sub: '7-day return policy'},
];

export default function Home() {
  const { store } = useStore();
  const products = useProducts();
  const [activeCategory, setActiveCategory] = useState('All');
  const [, setLocation] = useLocation();

  useEffect(() => {
    trackPageView();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = (store?.themeColors && typeof store.themeColors === 'object') ? store.themeColors as Record<string, unknown> : {};
    Object.entries(themeColors).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        root.style.setProperty(`--store-${key}`, String(value));
      }
    });
  }, [store?.themeColors]);

  useSeo({
    title: `${store?.name ?? STORE_CONFIG.storeName} — Trending Fashion & Lifestyle Products`,
    description: STORE_CONFIG.description.slice(0, 160),
    type: 'website',
  });

  const heroTagline = STORE_CONFIG.tagline.split(' & ');

  const filteredProducts = products.filter(p =>
    activeCategory === 'All' || p.category === activeCategory
  ).slice(0, 8);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden" style={{ aspectRatio: '21/8', minHeight: 280 }}>
          <img
            src="/hero.png"
            alt="Hero banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(26,26,26,0.48)' }}
          />
          <div className="relative z-10 h-full flex items-center container mx-auto px-6">
            <div className="max-w-lg">
              <p
                className="animate-fade-up text-white/70 text-[10px] font-semibold uppercase tracking-[0.18em] mb-4"
              >
                New Collection 2026
              </p>
              <h1
                className="animate-fade-up animate-fade-up-delay-1 text-white font-extrabold leading-none mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em' }}
              >
                {heroTagline[0]} &<br />
                {heroTagline[1] ?? ''}
              </h1>
              <p
                className="animate-fade-up animate-fade-up-delay-2 text-white/75 mb-6 max-w-sm text-sm leading-relaxed"
              >
                {STORE_CONFIG.description.slice(0, 110)}
              </p>
              <div className="animate-fade-up animate-fade-up-delay-3 flex flex-wrap gap-3">
                <button
                  onClick={() => { trackClickButton('shop_now_hero'); setLocation('/catalog'); }}
                  className="font-semibold text-sm transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#1A1A1A',
                    paddingInline: 28,
                    paddingBlock: 12,
                    borderRadius: 6,
                    letterSpacing: '0.04em',
                  }}
                  data-testid="button-shop-now"
                >
                  Shop Now
                </button>
                <button
                  onClick={() => setLocation('/contact')}
                  className="font-semibold text-sm text-white transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1.5px solid rgba(255,255,255,0.55)',
                    paddingInline: 28,
                    paddingBlock: 12,
                    borderRadius: 6,
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.55)')}
                  data-testid="button-contact-hero"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Strip ──────────────────────────────────────────────── */}
        <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E7E5' }}>
          <div className="container mx-auto px-4">
            <div className="flex justify-center sm:justify-between items-center flex-wrap gap-0 divide-x divide-[#E8E7E5]">
              {trustItems.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-6 py-4 flex-1 min-w-[180px]"
                >
                  <Icon size={18} strokeWidth={1.5} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[13px] text-foreground leading-none">{label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#A8A7A5' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Shop by Category ─────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                style={{ color: '#A8A7A5' }}
              >
                Browse
              </p>
              <h2
                className="text-2xl md:text-3xl font-extrabold text-foreground"
                style={{ letterSpacing: '-0.02em' }}
              >
                Shop by Category
              </h2>
            </div>
            <button
              onClick={() => setLocation('/catalog')}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{ textUnderlineOffset: 3 }}
            >
              View All <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categoryCards.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { trackClickButton(`category_${cat.name.toLowerCase()}`); setLocation('/catalog'); }}
                className="group relative text-left overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: 8,
                  padding: '2rem 1.75rem',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
                data-testid={`category-card-${cat.name}`}
              >
                <cat.Icon
                  size={28}
                  strokeWidth={1.25}
                  className="text-white/40 mb-4 transition-colors group-hover:text-white/60"
                />
                <p className="text-white/50 text-[10px] uppercase tracking-[0.14em] font-medium mb-1.5">
                  {cat.label}
                </p>
                <h3
                  className="text-white font-bold text-xl mb-1"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {cat.name}
                </h3>
                <p className="text-white/55 text-sm mb-5">{cat.description}</p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/70 uppercase tracking-wider group-hover:text-white transition-colors">
                  Shop <ArrowRight size={12} strokeWidth={2} />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Products Section ──────────────────────────────────────────── */}
        <section id="products" className="container mx-auto px-4 pb-16">
          <CountdownTimer />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.16em] mb-2"
                style={{ color: '#A8A7A5' }}
              >
                Featured
              </p>
              <h2
                className="text-2xl md:text-3xl font-extrabold text-foreground"
                style={{ letterSpacing: '-0.02em' }}
              >
                Trending Now
              </h2>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="whitespace-nowrap text-sm font-medium transition-all"
                  style={{
                    paddingInline: 16,
                    paddingBlock: 7,
                    borderRadius: 6,
                    border: activeCategory === cat
                      ? '1.5px solid #1A1A1A'
                      : '1.5px solid #E8E7E5',
                    backgroundColor: activeCategory === cat ? '#1A1A1A' : 'transparent',
                    color: activeCategory === cat ? '#FFFFFF' : '#71706E',
                  }}
                  data-testid={`filter-category-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => { trackClickButton('view_all_products'); setLocation('/catalog'); }}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-all active:scale-[0.97]"
              style={{
                border: '1.5px solid #1A1A1A',
                color: '#1A1A1A',
                paddingInline: 32,
                paddingBlock: 12,
                borderRadius: 6,
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1A1A1A';
                (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = '#1A1A1A';
              }}
              data-testid="button-view-all"
            >
              View All Products <ArrowRight size={15} strokeWidth={1.5} />
            </button>
          </div>
        </section>

        {/* ── Recently Viewed ───────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pb-4">
          <RecentlyViewed maxItems={6} />
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#1A1A1A' }}>
        <div className="container mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="mb-4">
                <span
                  className="font-extrabold text-xl text-white select-none"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {store?.name ?? STORE_CONFIG.storeName}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#71706E' }}>
                {STORE_CONFIG.tagline}. COD available nationwide.
              </p>
            </div>
            <div>
              <h4
                className="text-white font-semibold text-[11px] uppercase tracking-[0.14em] mb-4"
              >
                Quick Links
              </h4>
              <div className="flex flex-col gap-2.5 text-sm" style={{ color: '#71706E' }}>
                {[
                  { label: 'Home',          href: '/'              },
                  { label: 'Catalog',       href: '/catalog'       },
                  { label: 'Contact',       href: '/contact'       },
                  { label: 'Return Policy', href: '/return-policy' },
                ].map(({ label, href }) => (
                  <button
                    key={href}
                    onClick={() => setLocation(href)}
                    className="text-left transition-colors hover:text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4
                className="text-white font-semibold text-[11px] uppercase tracking-[0.14em] mb-4"
              >
                Contact
              </h4>
              <div className="flex flex-col gap-2.5 text-sm" style={{ color: '#71706E' }}>
                <span>WhatsApp: +92 300 1234567</span>
                <span>Mon–Sat: 9am – 9pm</span>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>
          <div
            className="pt-8 text-center text-xs"
            style={{ borderTop: '1px solid #2A2A2A', color: '#71706E' }}
          >
            {STORE_CONFIG.copyright}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
