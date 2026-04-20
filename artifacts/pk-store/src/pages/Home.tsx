import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Zap, Truck, ShieldCheck, Tag } from 'lucide-react';
import { products } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { useCart } from '../hooks/use-cart';

const categories = ["All", "Clothing", "Digital", "Beauty"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useCart();
  const [, setLocation] = useLocation();

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Top Announcement Bar */}
      <div className="bg-destructive text-destructive-foreground py-1.5 px-4 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
        <Zap size={14} className="animate-pulse" />
        Flash Sale: Free Delivery on orders over Rs. 3000
        <Zap size={14} className="animate-pulse" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="font-black text-2xl tracking-tighter uppercase cursor-pointer" onClick={() => setLocation('/')}>
            PK<span className="text-primary">STORE</span>
          </div>
          
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                type="search" 
                placeholder="Search products..." 
                className="pl-9 bg-muted border-none rounded-full h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-desktop"
              />
            </div>
          </div>
          
          <button 
            className="relative p-2 hover:bg-muted rounded-full transition-colors"
            onClick={() => setLocation('/cart')}
            data-testid="button-cart"
          >
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Mobile Search */}
        <div className="container mx-auto px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              type="search" 
              placeholder="What are you looking for?" 
              className="pl-9 bg-muted border-none rounded-full h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-mobile"
            />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        {!searchQuery && activeCategory === "All" && (
          <section className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-muted overflow-hidden flex items-center">
            <img 
              src="/src/assets/hero.png" 
              alt="Hero banner" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/20" />
            <div className="container mx-auto px-4 relative z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-lg"
              >
                <span className="inline-block py-1 px-2 bg-primary/20 text-primary font-bold text-xs uppercase tracking-wider rounded mb-4">
                  New Collection
                </span>
                <h1 className="text-4xl md:text-6xl font-black leading-none mb-4 text-foreground">
                  Premium Quality.<br/>Unbeatable Price.
                </h1>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Upgrade your lifestyle with our curated collection of premium products. Limited stock available.
                </p>
                <button 
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold uppercase tracking-wider hover-elevate transition-all hover:bg-primary/90"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Shop Now
                </button>
              </motion.div>
            </div>
          </section>
        )}

        {/* Trust Badges */}
        {!searchQuery && activeCategory === "All" && (
          <section className="bg-card border-b border-border py-4">
            <div className="container mx-auto px-4 flex justify-between items-center overflow-x-auto no-scrollbar gap-6">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Truck size={16} />
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">100% Original</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Tag size={16} />
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">Best Prices</span>
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        <section id="products" className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Trending Now</h2>
              <div className="w-12 h-1 bg-primary mt-2"></div>
            </div>
            
            {/* Category Filter */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    activeCategory === cat 
                      ? 'bg-foreground text-background' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`filter-category-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-border border-dashed">
              <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
              <button 
                onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                className="text-primary font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="font-black text-2xl tracking-tighter uppercase mb-4">
            PK<span className="text-primary">STORE</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Premium products delivered straight to your doorstep across Pakistan. Cash on Delivery available.
          </p>
          <div className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} PK Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
