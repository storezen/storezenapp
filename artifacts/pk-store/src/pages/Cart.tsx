import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Trash2, ShoppingBag, ShieldCheck, Tag } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { STORE_CONFIG } from '../config';
import { CODForm } from '../components/CODForm';
import { CouponInput, type AppliedCoupon } from '../components/CouponInput';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { CompleteYourLook } from '../components/Recommendations';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  const [isCODOpen,      setIsCODOpen]      = useState(false);
  const [appliedCoupon,  setAppliedCoupon]  = useState<AppliedCoupon | null>(null);

  // ── Price calculations ───────────────────────────────────────────────────
  const freeDelivery     = cartTotal >= 2000;
  const baseDelivery     = freeDelivery ? 0 : STORE_CONFIG.deliveryCharge;

  // When coupon is applied: use its finalDelivery (but cap at baseDelivery)
  const effectiveDelivery = appliedCoupon
    ? Math.min(appliedCoupon.finalDelivery, baseDelivery)
    : baseDelivery;

  // Discount from coupon (free_delivery type's saving = delivery amount)
  const couponSaving = appliedCoupon ? appliedCoupon.discount : 0;

  // For free_delivery coupon, the "saving" is the delivery amount
  // For percentage/fixed, it reduces the subtotal
  const isFreeDelivCoupon = appliedCoupon?.coupon.discount_type === 'free_delivery';
  const itemDiscount      = isFreeDelivCoupon ? 0 : couponSaving;
  const grandTotal        = cartTotal - itemDiscount + effectiveDelivery;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOrderSuccess = () => {
    clearCart();
    setAppliedCoupon(null);
  };

  // Re-calculate coupon discount whenever cart changes (in case cartTotal changes)
  const handleCouponApply = (coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
          <button
            onClick={() => setLocation('/')}
            className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="font-bold flex-1 text-center pr-8">Your Cart (0)</span>
        </header>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-6">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
          <button
            onClick={() => setLocation('/')}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
          >
            Start Shopping
          </button>
        </div>
        {/* Recently viewed picks for empty cart */}
        <div className="max-w-2xl mx-auto w-full px-4 pb-10">
          <RecentlyViewed title="Continue Shopping" maxItems={6} />
        </div>
      </div>
    );
  }

  // ── Cart with items ───────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
        <button
          onClick={() => setLocation('/')}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
          data-testid="button-back-cart"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold flex-1 text-center pr-8">Your Cart ({items.length})</span>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-8 flex flex-col md:flex-row gap-8">
        {/* ── Item list ── */}
        <div className="flex-1">
          <div className="space-y-4">
            {items.map((item, idx) => {
              const price = item.variant?.optionPrice ?? item.product.price;
              return (
                <div
                  key={idx}
                  className="flex gap-4 p-4 bg-card border border-border rounded-xl shadow-sm"
                >
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <Link
                        href={`/product/${item.product.id}`}
                        className="font-bold hover:underline line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-auto">
                      {item.variant?.size      && <span className="mr-2">Size: {item.variant.size}</span>}
                      {item.variant?.color     && <span className="mr-2">Color: {item.variant.color}</span>}
                      {item.variant?.optionName && <span>{item.variant.optionName}</span>}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-sm font-medium">Qty: {item.quantity}</span>
                      <span className="font-black text-primary">Rs. {price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Order Summary ── */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
          <div className="bg-muted/30 border border-border rounded-xl p-6 sticky top-20">
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Order Summary</h3>

            {/* Coupon Input — above summary numbers */}
            <CouponInput
              subtotal={cartTotal}
              deliveryCharge={baseDelivery}
              appliedCoupon={appliedCoupon}
              onApply={handleCouponApply}
              onRemove={handleCouponRemove}
            />

            {/* Price breakdown */}
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">Rs. {cartTotal}</span>
              </div>

              {/* Coupon discount row */}
              {appliedCoupon && !isFreeDelivCoupon && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium">
                    <Tag size={12} />
                    Coupon ({appliedCoupon.code})
                  </span>
                  <span className="font-black text-green-600 dark:text-green-400">
                    −Rs. {appliedCoupon.discount}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge</span>
                {effectiveDelivery === 0 ? (
                  <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                ) : (
                  <span className="font-medium">Rs. {effectiveDelivery}</span>
                )}
              </div>

              {/* Free delivery coupon saving */}
              {isFreeDelivCoupon && appliedCoupon.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium text-xs">
                    <Tag size={11} />
                    Delivery saved ({appliedCoupon.code})
                  </span>
                  <span className="font-black text-green-600 dark:text-green-400 text-xs">
                    −Rs. {appliedCoupon.discount}
                  </span>
                </div>
              )}

              {freeDelivery && !appliedCoupon && (
                <p className="text-[11px] text-green-600 dark:text-green-400">
                  Free delivery on orders above Rs. 2,000
                </p>
              )}

              <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-black text-2xl text-primary">Rs. {grandTotal}</span>
              </div>

              {appliedCoupon && (
                <p className="text-xs text-green-600 dark:text-green-400 font-bold text-right -mt-1">
                  You saved Rs. {appliedCoupon.discount}! 🎉
                </p>
              )}
            </div>

            {/* Trust badge */}
            <div className="bg-card border border-border rounded-lg p-3 mb-6 flex gap-3 text-sm">
              <div className="text-primary mt-0.5"><ShieldCheck size={18} /></div>
              <div>
                <span className="font-bold block mb-0.5">Secure Checkout</span>
                <span className="text-muted-foreground text-xs leading-tight block">
                  Pay comfortably with Cash on Delivery when your order arrives.
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCODOpen(true)}
              className="w-full bg-foreground text-background h-14 rounded-full font-black text-lg uppercase tracking-wider transition-transform active:scale-[0.98] hover:opacity-90 shadow-lg flex items-center justify-center gap-2"
              data-testid="button-checkout"
            >
              Checkout Now
            </button>
          </div>
        </div>
      </main>

      {/* Complete Your Look — cross-category picks */}
      {items.length > 0 && (
        <div className="max-w-2xl mx-auto w-full px-4">
          <CompleteYourLook cartItems={items} />
        </div>
      )}

      {/* Continue Shopping — recently viewed suggestions */}
      <div className="max-w-2xl mx-auto w-full px-4 pb-6">
        <RecentlyViewed title="Continue Shopping" maxItems={6} />
      </div>

      <CODForm
        open={isCODOpen}
        onOpenChange={setIsCODOpen}
        items={items}
        onOrderSuccess={handleOrderSuccess}
        appliedCoupon={appliedCoupon}
      />
    </div>
  );
}
