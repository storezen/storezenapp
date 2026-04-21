import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../hooks/use-cart';
import { CODForm } from '../components/CODForm';
import { type AppliedCoupon } from '../components/CouponInput';

const CHECKOUT_COUPON_KEY = 'pk-checkout-coupon';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, clearCart } = useCart();
  const [open, setOpen] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_COUPON_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AppliedCoupon;
      if (parsed?.code && parsed?.coupon) setAppliedCoupon(parsed);
    } catch {
      setAppliedCoupon(null);
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
        <button onClick={() => setLocation('/catalog')} className="text-primary font-semibold hover:underline">
          Browse products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-14 flex items-center px-4">
        <button
          onClick={() => setLocation('/cart')}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors -ml-2"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold flex-1 text-center pr-8">Checkout</span>
      </header>
      <CODForm
        open={open}
        onOpenChange={setOpen}
        items={items}
        appliedCoupon={appliedCoupon}
        onOrderSuccess={() => {
          clearCart();
          setAppliedCoupon(null);
          try {
            sessionStorage.removeItem(CHECKOUT_COUPON_KEY);
          } catch {
            // ignore storage issues
          }
        }}
      />
    </div>
  );
}
