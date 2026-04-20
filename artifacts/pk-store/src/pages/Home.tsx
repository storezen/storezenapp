import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { products } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
import { CountdownTimer } from '../components/CountdownTimer';

const categories = ["All", "Clothing", "Digital", "Beauty"];

const categoryCards = [
  {
    name: "Clothing",
    label: "Fashion & Apparel",
    bg: "from-slate-800 to-slate-900",
    emoji: "👕",
    description: "T-shirts, hoodies & more"
  },
  {
    name: "Digital",
    label: "Digital Products",
    bg: "from-violet-700 to-purple-900",
    emoji: "💻",
    description: "eBooks, guides & tools"
  },
  {
    name: "Beauty",
    label: "Beauty & Fragrance",
    bg: "from-rose-600 to-pink-900",
    emoji: "✨",
    description: "Perfumes & cosmetics"
  },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [, setLocation] = useLocation();

  const filteredProducts = products.filter(p =>
    activeCategory === "All" || p.category === activeCategory
  ).slice(0, 8);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full aspect-[16/9] md:aspect-[21/8] bg-muted overflow-hidden flex items-center">
          <img
            src="/hero.png"
            alt="Hero banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-lg"
            >
              <span className="inline-block py-1 px-3 bg-primary text-primary-foreground font-bold text-[11px] uppercase tracking-widest rounded-full mb-4">
                New Collection 2026
              </span>
              <h1 className="text-4xl md:text-6xl font-black leading-none mb-4">
                Premium Quality.<br />
                <span className="text-primary">Unbeatable</span> Price.
              </h1>
              <p className="text-muted-foreground mb-6 max-w-sm text-sm md:text-base">
                Curated premium products delivered to your doorstep. Cash on Delivery available across Pakistan.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className="bg-primary text-primary-foreground px-7 py-3 rounded-full font-black uppercase tracking-wide hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
                  onClick={() => setLocation('/catalog')}
                  data-testid="button-shop-now"
                >
                  Shop Now
                </button>
                <button
                  className="bg-background/80 backdrop-blur border border-border text-foreground px-7 py-3 rounded-full font-bold uppercase tracking-wide hover:bg-muted transition-all active:scale-[0.98]"
                  onClick={() => setLocation('/contact')}
                  data-testid="button-contact-hero"
                >
                  Contact Us
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="bg-card border-y border-border">
          <div className="container mx-auto px-4 py-4 flex justify-center sm:justify-between items-center flex-wrap gap-6">
            {[
              { icon: Truck, label: 'Fast Delivery', sub: '2-4 working days' },
              { icon: ShieldCheck, label: '100% Authentic', sub: 'Quality guaranteed' },
              { icon: Tag, label: 'Best Prices', sub: 'Unbeatable deals' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="font-bold text-sm leading-none">{label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shop by Category */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Shop by Category</h2>
              <div className="w-10 h-1 bg-primary mt-2" />
            </div>
            <button
              onClick={() => setLocation('/catalog')}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categoryCards.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation('/catalog')}
                className={`relative bg-gradient-to-br ${cat.bg} text-white rounded-2xl p-6 text-left overflow-hidden group transition-all`}
                data-testid={`category-card-${cat.name}`}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="relative z-10">
                  <span className="text-4xl block mb-3">{cat.emoji}</span>
                  <h3 className="font-black text-xl leading-tight mb-1">{cat.name}</h3>
                  <p className="text-white/70 text-sm">{cat.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-white/90">
                    Shop Now <ArrowRight size={12} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="container mx-auto px-4 pb-16">
          <CountdownTimer />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Trending Now</h2>
              <div className="w-10 h-1 bg-primary mt-2" />
            </div>

            {/* Category Filter pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-foreground text-background'
                      : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                  data-testid={`filter-category-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </AnimatePresence>

          {/* View All CTA */}
          <div className="text-center mt-10">
            <button
              onClick={() => setLocation('/catalog')}
              className="inline-flex items-center gap-2 border-2 border-foreground text-foreground px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
              data-testid="button-view-all"
            >
              View All Products <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-black text-2xl tracking-tighter uppercase mb-3">
                PK<span className="text-primary">STORE</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Premium products delivered across Pakistan. COD available nationwide.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <button onClick={() => setLocation('/')} className="text-left hover:text-primary transition-colors">Home</button>
                <button onClick={() => setLocation('/catalog')} className="text-left hover:text-primary transition-colors">Catalog</button>
                <button onClick={() => setLocation('/contact')} className="text-left hover:text-primary transition-colors">Contact</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-3">Contact</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>WhatsApp: +92 300 1234567</span>
                <span>Mon–Sat: 9am – 9pm</span>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PK Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
