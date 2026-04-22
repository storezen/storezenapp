import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Product } from '../data/products';
import { useProducts } from '../hooks/use-products';
import { ArrowRight } from 'lucide-react';

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const products = useProducts();
  const related = products.filter(
    p => p.id !== currentProductId && (p.category === category || Math.random() > 0.5)
  ).slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-12 border-t border-border pt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">You May Also Like</h2>
        <Link href="/" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map((product, i) => (
          <RelatedCard key={product.id} product={product} delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}

function RelatedCard({ product, delay }: { product: Product; delay: number }) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link href={`/product/${product.id}`} className="group flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="font-bold text-sm leading-tight line-clamp-2">{product.name}</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-primary font-black text-sm">Rs. {product.price}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">Rs. {product.compareAtPrice}</span>
            )}
          </div>
          {discount > 0 && (
            <span className="text-[10px] bg-destructive/10 text-destructive font-bold px-1.5 py-0.5 rounded mt-1 w-fit">
              {discount}% OFF
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
