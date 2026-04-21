import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { ProductCard } from '../components/ProductCard';
import { Navbar } from '../components/Navbar';
import { CountdownTimer } from '../components/CountdownTimer';
import { useSeo } from '../hooks/useSeo';
import { useStore } from '../hooks/use-store';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

const categories = ['All', 'Clothing', 'Digital', 'Beauty'];

export default function Catalog() {
  const { store } = useStore();
  useSeo({ title: `Shop All Products — ${store?.name ?? 'Store'}`, description: 'Browse our full collection of products. Cash on Delivery Pakistan.' });

  const products = useProducts();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState<SortOption>('featured');

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    switch (sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: break;
    }

    return list;
  }, [search, activeCategory, sort]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar onSearchChange={setSearch} searchValue={search} showSearch />

      <main className="flex-1 container mx-auto px-4 py-8">
        <CountdownTimer />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">All Products</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-muted-foreground flex-shrink-0" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="bg-card border border-border text-sm font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              data-testid="select-sort"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetically, A-Z</option>
              <option value="name-desc">Alphabetically, Z-A</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
              data-testid={`filter-${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border border-dashed border-border">
            <div className="text-4xl mb-4">-</div>
            <p className="text-muted-foreground font-medium mb-4">No products match your search</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All'); }}
              className="text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <footer className="bg-card border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © 2026 {store?.name ?? 'Store'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
