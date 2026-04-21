import { Link } from 'wouter';
import { Product } from '../data/products';
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
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={i <= rating ? '#1A1A1A' : 'none'}
          stroke={i <= rating ? '#1A1A1A' : '#D5D4D2'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const productPath = `/product/${product.slug ?? product.id}`;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const rating = getProductRating(product.id);
  const soldOut = isProductSoldOut(product.id);
  const minStock = getProductMinStock(product.id);
  const isLowStock = !soldOut && minStock <= 9;
  const { isWishlisted, toggle } = useWishlist();

  return (
    <div
      className={`group relative flex flex-col bg-card overflow-hidden transition-all duration-300 ${soldOut ? 'opacity-60' : 'hover:-translate-y-1.5'}`}
      style={{
        border: '1px solid #F0EFED',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'transform 0.28s cubic-bezier(0.25,0.1,0.25,1), box-shadow 0.28s cubic-bezier(0.25,0.1,0.25,1)',
      }}
      onMouseEnter={e => {
        if (!soldOut) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      }}
      data-testid={`card-product-${product.id}`}
    >
      {/* Image area — 3:4 ratio */}
      <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '3/4' }}>
        <Link href={productPath} className="absolute inset-0 z-0" />

        {/* Sale badge — top left */}
        {discount > 0 && !soldOut && (
          <div
            className="absolute top-2 left-2 z-10 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider"
            style={{ backgroundColor: '#C4362A', borderRadius: 4 }}
          >
            -{discount}%
          </div>
        )}

        {/* Low Stock badge — top left, below sale */}
        {isLowStock && (
          <div
            className="absolute z-10 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider stock-pulse"
            style={{
              top: discount > 0 ? 28 : 8,
              left: 8,
              backgroundColor: '#71706E',
              borderRadius: 4,
            }}
          >
            Low Stock
          </div>
        )}

        {/* Wishlist button — top right */}
        <button
          onClick={e => { e.preventDefault(); toggle(product.id); }}
          className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center transition-opacity"
          style={{
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderRadius: '50%',
            border: '1px solid rgba(232,231,229,0.8)',
            backdropFilter: 'blur(4px)',
          }}
          aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          data-testid={`btn-wishlist-${product.id}`}
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            style={{
              fill: isWishlisted(product.id) ? '#1A1A1A' : 'none',
              color: isWishlisted(product.id) ? '#1A1A1A' : '#71706E',
            }}
          />
        </button>

        {/* Sold Out overlay */}
        {soldOut && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(247,246,243,0.72)' }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest px-4 py-2"
              style={{
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
                borderRadius: 4,
              }}
            >
              Sold Out
            </span>
          </div>
        )}

        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${soldOut ? '' : 'group-hover:scale-104'}`}
          style={{ transition: 'transform 0.5s cubic-bezier(0.25,0.1,0.25,1)' }}
          loading="lazy"
        />

        {/* Quick-add CTA — desktop: reveal on hover; mobile: always visible */}
        {!soldOut && (
          <Link
            href={productPath}
            className="absolute bottom-0 left-0 right-0 z-10 text-center text-[12px] font-semibold py-2.5 transition-all duration-200 md:translate-y-full md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            style={{
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
            }}
            data-testid={`button-order-${product.id}`}
          >
            View Product
          </Link>
        )}
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Overline — category */}
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: '#A8A7A5' }}
        >
          {product.category}
        </p>

        {/* Product name */}
        <Link href={productPath}>
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2 text-foreground hover:underline"
            style={{ textUnderlineOffset: 3 }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        {rating && (
          <div className="flex items-center gap-1.5">
            <StarRatingSmall rating={Math.round(rating.avg)} />
            <span className="text-[10px]" style={{ color: '#A8A7A5' }}>({rating.count})</span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
            Rs. {product.price}
          </span>
          {product.compareAtPrice && (
            <span
              className="text-xs line-through"
              style={{ color: '#A8A7A5', fontVariantNumeric: 'tabular-nums' }}
            >
              Rs. {product.compareAtPrice}
            </span>
          )}
        </div>

        {/* Stock badge */}
        <div className="mb-1">
          <StockBadge productId={product.id} />
        </div>

        {/* CTA visible on mobile, hidden on desktop (shown in hover overlay above) */}
        <Link
          href={productPath}
          className="md:hidden w-full text-center py-2.5 text-[12px] font-semibold transition-colors"
          style={{
            backgroundColor: soldOut ? '#EEEDEB' : '#1A1A1A',
            color: soldOut ? '#A8A7A5' : '#FFFFFF',
            borderRadius: 6,
            letterSpacing: '0.04em',
            pointerEvents: soldOut ? 'none' : 'auto',
          }}
          data-testid={`button-order-mobile-${product.id}`}
        >
          {soldOut ? 'Sold Out' : 'View Product'}
        </Link>
      </div>
    </div>
  );
}
