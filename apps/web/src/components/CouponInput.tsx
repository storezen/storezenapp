import { useState, useRef } from 'react';
import { Tag, X, CheckCircle, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { validateCoupon, calculateDiscount, type Coupon } from '../data/coupons';

/* ── Exported type — shared with Cart + CODForm ─────────────────────────── */
export type AppliedCoupon = {
  code:          string;
  coupon:        Coupon;
  discount:      number;   // Rs. saved
  finalDelivery: number;   // delivery after coupon
};

/* ── Props ───────────────────────────────────────────────────────────────── */
interface CouponInputProps {
  subtotal:       number;
  deliveryCharge: number;
  appliedCoupon:  AppliedCoupon | null;
  onApply:        (applied: AppliedCoupon) => void;
  onRemove:       () => void;
  validateWithApi?: (code: string, subtotal: number, deliveryCharge: number) => Promise<AppliedCoupon>;
}

/* ── Component ───────────────────────────────────────────────────────────── */
export function CouponInput({
  subtotal,
  deliveryCharge,
  appliedCoupon,
  onApply,
  onRemove,
  validateWithApi,
}: CouponInputProps) {
  const [isOpen,     setIsOpen]     = useState(false);
  const [code,       setCode]       = useState('');
  const [error,      setError]      = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleApply = async () => {
    // Read from both ref (DOM) and state for Playwright compatibility
    const val = (inputRef.current?.value ?? code).trim().toUpperCase();
    if (!val) { setError('Please enter a coupon code.'); return; }
    setIsLoading(true);
    setError('');

    try {
      if (validateWithApi) {
        const applied = await validateWithApi(val, subtotal, deliveryCharge);
        onApply(applied);
      } else {
        const result = validateCoupon(val, subtotal);
        if (!result.valid) {
          setError(result.error);
          setIsLoading(false);
          return;
        }
        const { discount, finalDelivery } = calculateDiscount(
          result.coupon,
          subtotal,
          deliveryCharge,
        );
        onApply({
          code:    val,
          coupon:  result.coupon,
          discount,
          finalDelivery,
        });
      }
      setCode('');
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid coupon');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Applied state ── */
  if (appliedCoupon) {
    return (
      <div
        className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4"
        data-testid="coupon-applied-banner"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-green-600 dark:text-green-400">
                Code "{appliedCoupon.code}" applied!
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                {appliedCoupon.coupon.discount_type === 'free_delivery'
                  ? `Free delivery! You saved Rs. ${appliedCoupon.discount}`
                  : `You saved Rs. ${appliedCoupon.discount} 🎉`}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-green-500/20 rounded-full transition-colors text-green-600 dark:text-green-400 flex-shrink-0"
            aria-label="Remove coupon"
            data-testid="btn-remove-coupon"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Input state ── */
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        data-testid="btn-toggle-coupon"
      >
        <Ticket size={14} />
        Have a coupon code?
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
                placeholder="COUPON CODE"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono tracking-widest uppercase"
                data-testid="input-coupon-code"
                autoFocus
              />
            </div>
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-black rounded-xl text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
              data-testid="button-apply-coupon"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin inline-block" />
              ) : 'Apply'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium flex items-start gap-1.5 px-1" data-testid="coupon-error">
              ❌ {error}
            </p>
          )}

          {/* Hint chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['FIRST10', 'SAVE200', 'FREEDELIVERY'].map(hint => (
              <button
                key={hint}
                onClick={() => { setCode(hint); setError(''); }}
                className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
