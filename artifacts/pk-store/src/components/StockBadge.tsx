import { Flame, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// ─── Per-variant stock data ───────────────────────────────────────────────────
// Key: productId → variantKey → { current, total }
// variantKey = "Size-Color" | optionName | "default"
const VARIANT_STOCK: Record<string, Record<string, { current: number; total: number }>> = {
  'tshirt-1': {
    'S-Black':   { current: 3,  total: 50 },
    'S-White':   { current: 15, total: 50 },
    'M-Black':   { current: 8,  total: 50 },
    'M-White':   { current: 25, total: 50 },
    'L-Black':   { current: 12, total: 50 },
    'L-White':   { current: 30, total: 50 },
    'XL-Black':  { current: 5,  total: 50 },
    'XL-White':  { current: 18, total: 50 },
    '2XL-Black': { current: 0,  total: 50 },
    '2XL-White': { current: 7,  total: 50 },
    '3XL-Black': { current: 2,  total: 50 },
    '3XL-White': { current: 11, total: 50 },
    'default':   { current: 7,  total: 50 },
  },
  'ebook-1': {
    'PDF':          { current: 999, total: 999 },
    'EPUB':         { current: 999, total: 999 },
    'Both Formats': { current: 999, total: 999 },
    'default':      { current: 999, total: 999 },
  },
  'perfume-1': {
    'default': { current: 4, total: 30 },
  },
};

// ─── Utility functions ────────────────────────────────────────────────────────

export function getVariantStock(
  productId: string,
  size?: string,
  color?: string,
  optionName?: string
): { current: number; total: number } {
  const ps = VARIANT_STOCK[productId];
  if (!ps) return { current: 99, total: 99 };
  if (optionName) return ps[optionName] ?? ps['default'] ?? { current: 99, total: 99 };
  if (size && color) return ps[`${size}-${color}`] ?? ps['default'] ?? { current: 99, total: 99 };
  return ps['default'] ?? { current: 99, total: 99 };
}

export function getProductMinStock(productId: string): number {
  const ps = VARIANT_STOCK[productId];
  if (!ps) return 99;
  const values = Object.values(ps).map(v => v.current);
  return Math.min(...values);
}

export function isProductSoldOut(productId: string): boolean {
  const ps = VARIANT_STOCK[productId];
  if (!ps) return false;
  return Object.values(ps).every(v => v.current === 0);
}

// Legacy — kept for backward-compat
export function getProductStock(productId: string): number {
  return getProductMinStock(productId);
}

// ─── StockIndicator — used on Product Detail page ────────────────────────────
interface StockIndicatorProps {
  current: number;
  total: number;
}

export function StockIndicator({ current, total }: StockIndicatorProps) {
  const depleted = total > 0 && total < 999 ? ((total - current) / total) * 100 : 0;
  const showBar = total < 999 && total > 0;

  if (current === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-destructive font-bold text-sm">
          <XCircle size={15} />
          <span>Out of Stock</span>
        </div>
        {showBar && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-destructive" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    );
  }

  if (current <= 9) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-destructive font-bold text-sm stock-pulse">
          <Flame size={14} className="animate-pulse" />
          <span>Only {current} left! Selling fast!</span>
        </div>
        {showBar && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive transition-all duration-500"
              style={{ width: `${Math.min(100, depleted)}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (current <= 20) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
          <AlertTriangle size={14} />
          <span>Only {current} left — order soon!</span>
        </div>
        {showBar && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, depleted)}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-bold text-sm">
      <CheckCircle size={14} />
      <span>In Stock</span>
    </div>
  );
}

// ─── StockBadge — compact badge used on Product Card ─────────────────────────
interface StockBadgeProps {
  productId: string;
  className?: string;
}

export function StockBadge({ productId, className = '' }: StockBadgeProps) {
  const minStock = getProductMinStock(productId);
  if (minStock > 20) return null;
  if (minStock === 0) return (
    <div className={`flex items-center gap-1 text-xs font-bold text-destructive ${className}`}>
      <XCircle size={11} />
      <span>Out of Stock</span>
    </div>
  );
  if (minStock <= 9) return (
    <div className={`flex items-center gap-1 text-xs font-bold text-destructive stock-pulse ${className}`}>
      <Flame size={11} className="animate-pulse" />
      <span>Only {minStock} left!</span>
    </div>
  );
  return (
    <div className={`flex items-center gap-1 text-xs font-bold text-amber-500 ${className}`}>
      <AlertTriangle size={11} />
      <span>{minStock} left — order soon</span>
    </div>
  );
}
