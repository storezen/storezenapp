import { Link } from 'wouter';
import { Clock, X } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/use-recently-viewed';
import { useProducts } from '../hooks/use-products';

interface RecentlyViewedProps {
  title?:     string;
  maxItems?:  number;
  excludeId?: string;
}

export function RecentlyViewed({
  title    = 'Recently Viewed',
  maxItems = 6,
  excludeId,
}: RecentlyViewedProps) {
  const { ids, clearAll } = useRecentlyViewed();
  const products = useProducts();

  const viewed = ids
    .filter(id => id !== excludeId)
    .slice(0, maxItems)
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as NonNullable<typeof products[0]>[];

  if (viewed.length === 0) return null;

  return (
    <section className="py-8" data-testid="recently-viewed-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-wide">
          <Clock size={17} className="text-primary" />
          {title}
        </h2>
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          data-testid="button-clear-history"
        >
          <X size={12} />
          Clear History
        </button>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-3 px-4 md:px-0 scroll-smooth snap-x snap-mandatory scrollbar-hide">
        {viewed.map(product => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="snap-start flex-shrink-0 w-[140px] sm:w-[160px] group"
            data-testid={`recently-viewed-card-${product.id}`}
          >
            <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Square thumbnail */}
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-semibold leading-snug line-clamp-2 text-foreground mb-1.5">
                  {product.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-primary">Rs. {product.price}</span>
                  {product.compareAtPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      Rs. {product.compareAtPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
