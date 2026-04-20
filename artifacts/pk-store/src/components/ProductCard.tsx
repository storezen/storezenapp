import { Link } from 'wouter';
import { Product } from '../data/products';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { StockBadge, getProductMinStock, isProductSoldOut } from './StockBadge';
import { getProductRating } from '../data/reviews';
import { useWishlist } from '../hooks/use-wishlist';

interface ProductCardProps {
  product: Product;
}

function StarRatingSmall({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={i <= rating ? 'text-amber-400' : 'text-muted-foreground/20'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const rating = getProductRating(product.id);
  const soldOut = isProductSoldOut(product.id);
  const minStock = getProductMinStock(product.id);
  const isLowStock = !soldOut && minStock <= 9;
  const { isWishlisted, toggle } = useWishlist();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={soldOut ? {} : { y: -4 }}
      transition={{ duration: 0.3 }}
      className={`group relative flex flex-col bg-card border border-card-border rounded-xl overflow-hidden shadow-sm hover:shadow-md ${soldOut ? 'opacity-60' : ''}`}
      data-testid={`card-product-${product.id}`}
    >
      <div className="block relative aspect-square overflow-hidden bg-muted">
        <Link href={`/product/${product.id}`} className="absolute inset-0 z-0" />

        {/* Sale badge */}
        {discount > 0 && !soldOut && (
          <div className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
            Save {discount}%
          </div>
        )}

        {/* Low Stock badge — left side, below sale badge */}
        {isLowStock && (
          <div className="absolute top-9 left-2 z-10 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide stock-pulse">
            🔥 Low Stock
          </div>
        )}

        {/* Wishlist heart button — top right */}
        <motion.button
          onClick={e => { e.preventDefault(); toggle(product.id); }}
          whileTap={{ scale: 1.35 }}
          className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm border border-border/30 hover:bg-background transition-colors"
          aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid={`btn-wishlist-${product.id}`}
        >
          <Heart
            size={15}
            className={isWishlisted(product.id) ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}
          />
        </motion.button>

        {/* Sold Out overlay */}
        {soldOut && (
          <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-foreground text-background text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Category pill */}
        <div className="absolute bottom-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {product.category}
        </div>

        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${soldOut ? '' : 'group-hover:scale-105'}`}
          loading="lazy"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <Link href={`/product/${product.id}`} className="hover:underline">
          <h3 className="font-bold text-base leading-tight text-foreground line-clamp-2">{product.name}</h3>
        </Link>

        {rating && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRatingSmall rating={Math.round(rating.avg)} />
            <span className="text-xs text-muted-foreground">({rating.count})</span>
          </div>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-black text-primary">Rs. {product.price}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">Rs. {product.compareAtPrice}</span>
          )}
        </div>

        <div className="mt-2 mb-3">
          <StockBadge productId={product.id} />
        </div>

        <Link
          href={`/product/${product.id}`}
          className={`mt-auto w-full font-semibold py-3 rounded-lg text-center transition-colors ${
            soldOut
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
          }`}
          data-testid={`button-order-${product.id}`}
        >
          {soldOut ? 'Sold Out' : 'Order Now'}
        </Link>
      </div>
    </motion.div>
  );
}
