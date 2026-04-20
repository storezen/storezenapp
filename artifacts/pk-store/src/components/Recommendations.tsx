/**
 * Recommendation components:
 *  - YouMightAlsoLike     → ProductDetail page
 *  - CompleteYourLook     → Cart page
 *  - CustomersAlsoBought  → OrderConfirmation page
 */
import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { useCart } from '../hooks/use-cart';
import type { CartItem } from '../hooks/use-cart';
import type { Product } from '../data/products';
import { useToast } from '../hooks/use-toast';

/* ─── Recommendation helpers ────────────────────────────────────────────── */

function shuffleStable<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) * 2654435761) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRelated(
  products: Product[],
  excludeId: string,
  category: string,
  count: number,
): Product[] {
  const others = products.filter(p => p.id !== excludeId && p.active !== false);
  const samecat = others.filter(p => p.category === category);
  const rest    = others.filter(p => p.category !== category);
  const seed    = excludeId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const combined = [...samecat, ...shuffleStable(rest, seed)];
  return combined.slice(0, count);
}

function getCrossCategory(
  products: Product[],
  cartCategories: Set<string>,
  excludeIds: Set<string>,
  count: number,
): Product[] {
  const active  = products.filter(p => p.active !== false && !excludeIds.has(p.id));
  const cross   = active.filter(p => !cartCategories.has(p.category));
  const fallback = active.filter(p => cartCategories.has(p.category));
  const seed = cartCategories.size * 1337;
  return [...cross, ...shuffleStable(fallback, seed)].slice(0, count);
}

function getCrossSell(
  products: Product[],
  excludeIds: Set<string>,
  count: number,
): Product[] {
  const active = products.filter(p => p.active !== false && !excludeIds.has(p.id));
  const seed   = excludeIds.size * 42;
  return shuffleStable(active, seed).slice(0, count);
}

/* ─── Shared Mini Product Card ──────────────────────────────────────────── */

interface MiniCardProps {
  product: Product;
  delay?: number;
  showQuickAdd?: boolean;
  'data-testid'?: string;
}

function MiniProductCard({ product, delay = 0, showQuickAdd = true, 'data-testid': testId }: MiniCardProps) {
  const { addToCart } = useCart();
  const { toast }     = useToast();
  const [adding, setAdding] = useState(false);

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const isSoldOut = product.stock === 0;

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || adding) return;

    const cartItem: CartItem = {
      id:        `${product.id}-default`,
      product,
      quantity:  1,
      variant:   null,
    };
    addToCart(cartItem);
    setAdding(true);
    toast({ title: 'Added to cart!', description: product.name });
    setTimeout(() => setAdding(false), 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
      className="snap-start flex-shrink-0 w-36 sm:w-40"
      data-testid={testId}
    >
      <Link href={`/product/${product.id}`} className="group block">
        {/* Image */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-2.5 border border-border/50 group-hover:border-primary/30 transition-colors">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Sale badge */}
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}

          {/* Sold out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">Sold Out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-1 px-0.5">
          <p className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-primary font-black text-sm">Rs. {product.price.toLocaleString()}</span>
            {product.compareAtPrice && (
              <span className="text-[10px] text-muted-foreground line-through">
                Rs. {product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Quick Add / View button */}
        {showQuickAdd && (
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold transition-all
              ${isSoldOut
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : adding
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              }`}
          >
            {isSoldOut
              ? <><Eye size={11} /> View</>
              : adding
                ? '✓ Added!'
                : <><ShoppingCart size={11} /> Quick Add</>
            }
          </button>
        )}
      </Link>
    </motion.div>
  );
}

/* ─── Horizontal Scroll Row ─────────────────────────────────────────────── */

interface RowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  cta?: { label: string; href: string };
  children: React.ReactNode;
  'data-testid'?: string;
}

function ScrollRow({ title, subtitle, icon, cta, children, 'data-testid': testId }: RowProps) {
  return (
    <div data-testid={testId}>
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="text-primary font-bold text-xs flex items-center gap-1 hover:underline flex-shrink-0"
          >
            {cta.label} <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  1. YouMightAlsoLike — ProductDetail page
 * ═══════════════════════════════════════════════════════════════════════════ */

interface YouMightAlsoLikeProps {
  currentProductId: string;
  category: string;
}

export function YouMightAlsoLike({ currentProductId, category }: YouMightAlsoLikeProps) {
  const products = useProducts();
  const related  = getRelated(products, currentProductId, category, 4);

  if (related.length === 0) return null;

  return (
    <div className="mt-10 border-t border-border pt-8">
      <ScrollRow
        title="You Might Also Like"
        subtitle="Handpicked recommendations for you"
        icon={<Sparkles size={16} className="text-primary" />}
        cta={{ label: 'View All', href: '/catalog' }}
        data-testid="section-you-might-also-like"
      >
        {related.map((product, i) => (
          <MiniProductCard
            key={product.id}
            product={product}
            delay={i * 0.07}
            data-testid={`reco-product-${product.id}`}
          />
        ))}
      </ScrollRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  2. CompleteYourLook — Cart page
 * ═══════════════════════════════════════════════════════════════════════════ */

interface CompleteYourLookProps {
  cartItems: CartItem[];
}

export function CompleteYourLook({ cartItems }: CompleteYourLookProps) {
  const products = useProducts();

  const cartCategories = new Set(cartItems.map(i => i.product.category));
  const cartIds        = new Set(cartItems.map(i => i.product.id));
  const picks          = getCrossCategory(products, cartCategories, cartIds, 4);

  if (picks.length === 0) return null;

  return (
    <div className="border-t border-border pt-8 mt-6">
      <ScrollRow
        title="Complete Your Look"
        subtitle={cartCategories.size > 0 ? `Pair it with something from our other collections` : undefined}
        icon={<Tag size={15} className="text-primary" />}
        cta={{ label: 'Shop All', href: '/catalog' }}
        data-testid="section-complete-your-look"
      >
        {picks.map((product, i) => (
          <MiniProductCard
            key={product.id}
            product={product}
            delay={i * 0.08}
            data-testid={`cyl-product-${product.id}`}
          />
        ))}
      </ScrollRow>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  3. CustomersAlsoBought — OrderConfirmation page
 * ═══════════════════════════════════════════════════════════════════════════ */

interface CustomersAlsoBoughtProps {
  orderedProductIds: string[];
}

export function CustomersAlsoBought({ orderedProductIds }: CustomersAlsoBoughtProps) {
  const products = useProducts();
  const excludeIds = new Set(orderedProductIds);
  const picks      = getCrossSell(products, excludeIds, 3);

  if (picks.length === 0) return null;

  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      data-testid="section-customers-also-bought"
    >
      {/* Promo banner */}
      <div className="mb-5 bg-gradient-to-r from-rose-500/10 via-pink-500/8 to-purple-500/10 border border-rose-500/20 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-black">🎉 Thank you for your order!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use code{' '}
            <span className="font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">COMEBACK10</span>
            {' '}for 10% off your next order!
          </p>
        </div>
        <Link
          href="/catalog"
          className="flex-shrink-0 text-xs font-black bg-primary text-primary-foreground px-3.5 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1"
          data-testid="btn-shop-more"
        >
          Shop More <ArrowRight size={12} />
        </Link>
      </div>

      <ScrollRow
        title="Customers Also Bought"
        subtitle="Popular picks our customers love"
        icon={<Sparkles size={15} className="text-primary" />}
        cta={{ label: 'Browse All', href: '/catalog' }}
        data-testid="section-also-bought-row"
      >
        {picks.map((product, i) => (
          <MiniProductCard
            key={product.id}
            product={product}
            delay={i * 0.1}
            data-testid={`also-bought-product-${product.id}`}
          />
        ))}
      </ScrollRow>
    </motion.div>
  );
}
