import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { STORE_CONFIG } from '../config';
import { trackInitiateCheckout, trackCompletePayment } from '../lib/tiktok-pixel';
import { CartItem } from '../hooks/use-cart';
import { setLastOrderId } from '../lib/orders';
import { useCart } from '../hooks/use-cart';
import { applyCouponUsage } from '../data/coupons';
import { type AppliedCoupon } from './CouponInput';
import { ChevronDown, Clock, Truck, StickyNote, User, Phone, MapPin, X, Tag, CreditCard, Upload, Copy, Check as CheckIcon } from 'lucide-react';
import { API_URL } from '../config';
import { useStore } from '../hooks/use-store';

type PaymentMethod = 'cod' | 'online';
type OnlineMethod  = 'jazzcash' | 'easypaisa' | 'bank';

// ─── Pakistani cities (delivery estimates) ───────────────────────────────────
const CITIES: { name: string; days: string }[] = [
  { name: 'Karachi',     days: '2-3 days' },
  { name: 'Lahore',      days: '1-2 days' },
  { name: 'Islamabad',   days: '1-2 days' },
  { name: 'Rawalpindi',  days: '1-2 days' },
  { name: 'Peshawar',    days: '2-3 days' },
  { name: 'Quetta',      days: '3-5 days' },
  { name: 'Multan',      days: '2-3 days' },
  { name: 'Faisalabad',  days: '2-3 days' },
  { name: 'Sialkot',     days: '2-3 days' },
  { name: 'Gujranwala',  days: '2-3 days' },
  { name: 'Hyderabad',   days: '2-3 days' },
  { name: 'Abbottabad',  days: '3-4 days' },
  { name: 'Sukkur',      days: '3-4 days' },
  { name: 'Larkana',     days: '3-5 days' },
  { name: 'Mirpur',      days: '3-4 days' },
  { name: 'Bahawalpur',  days: '3-4 days' },
  { name: 'Other',       days: '3-5 days' },
];

const LS_KEY = 'zorvik_customer_info';

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  return digits.slice(0, 4) + '-' + digits.slice(4);
}

// ─── Validation schema ─────────────────────────────────────────────────────────
const PK_PHONE = /^03[0-9]{9}$/;

const CITY_NAMES = CITIES.map((c) => c.name) as [string, ...string[]];

const schema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().refine((v) => PK_PHONE.test(v.replace(/\D/g, '')), 'Enter valid Pakistani mobile: 03XXXXXXXXX'),
    city: z.enum(CITY_NAMES, {
      required_error: 'Please select a city',
      invalid_type_error: 'Please select a city',
    }),
    cityOther: z.string().optional(),
    address: z.string().min(5, 'Please enter your complete address'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.city === 'Other' && (!data.cityOther || data.cityOther.trim().length < 2)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please enter your city name', path: ['cityOther'] });
    }
  });
type FormValues = z.infer<typeof schema>;

// ─── Props ─────────────────────────────────────────────────────────────────────
interface CODFormProps {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  items:          CartItem[];
  onOrderSuccess: () => void;
  appliedCoupon?: AppliedCoupon | null;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function CODForm({ open, onOpenChange, items, onOrderSuccess, appliedCoupon }: CODFormProps) {
  const [, setLocation]   = useLocation();
  const { store } = useStore();
  const { clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notesOpen, setNotesOpen]       = useState(false);
  const [isReturning, setIsReturning]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [onlineMethod,  setOnlineMethod]  = useState<OnlineMethod>('jazzcash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [copiedNumber, setCopiedNumber]   = useState(false);

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num.replace(/-/g, '')).catch(() => {});
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  }

  // ── Price calculations ───────────────────────────────────────────────────────
  const itemTotal = items.reduce((sum, item) => {
    const price = item.variant?.optionPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const deliverySettings =
    store?.deliverySettings && typeof store.deliverySettings === 'object'
      ? (store.deliverySettings as Record<string, unknown>)
      : ({} as Record<string, unknown>);
  const freeDeliveryThreshold = Number(deliverySettings.freeAbove ?? 2000);
  const defaultFee = Number(deliverySettings.fee ?? deliverySettings.standard ?? 200);
  const freeDelivery = itemTotal >= freeDeliveryThreshold;
  const baseDelivery = freeDelivery ? 0 : defaultFee;
  // Apply coupon
  const isFreeDelivCoupon = appliedCoupon?.coupon.discount_type === 'free_delivery';
  const effectiveDelivery = appliedCoupon
    ? Math.min(appliedCoupon.finalDelivery, baseDelivery)
    : baseDelivery;
  const itemDiscount  = appliedCoupon && !isFreeDelivCoupon ? appliedCoupon.discount : 0;
  const deliveryCharge = effectiveDelivery; // alias for clarity below
  const grandTotal    = itemTotal - itemDiscount + effectiveDelivery;

  // ── Form setup ──────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: { fullName: '', phone: '', city: '', cityOther: '', address: '', notes: '' },
  });

  const selectedCity = form.watch('city');
  const cityInfo     = CITIES.find(c => c.name === selectedCity);
  const isOtherCity  = selectedCity === 'Other';

  // ── Load saved customer info ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const trackItems = items.map(i => ({
      id:       i.product.id,
      price:    i.variant?.optionPrice ?? i.product.price,
      quantity: i.quantity,
    }));
    trackInitiateCheckout(trackItems, itemTotal);
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const info = JSON.parse(saved) as Partial<FormValues>;
        form.reset({
          fullName:  info.fullName  || '',
          phone:     info.phone     || '',
          city:      info.city      || '',
          cityOther: info.cityOther || '',
          address:   info.address   || '',
          notes:     '',
        });
        if (info.fullName) setIsReturning(true);
      } else {
        form.reset({ fullName: '', phone: '', city: '', cityOther: '', address: '', notes: '' });
        setIsReturning(false);
      }
    } catch { /* ignore */ }
  }, [open]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    form.clearErrors('root');
    if (!store?.id) {
      form.setError('root', { message: 'Store is not available. Please refresh and try again.' });
      return;
    }
    if (paymentMethod === 'online' && !transactionId.trim()) {
      form.setError('root', { message: 'Please enter your payment transaction ID for online orders.' });
      return;
    }

    const rawPhone = data.phone.replace(/\D/g, '');
    if (!PK_PHONE.test(rawPhone)) {
      form.setError('phone', { message: 'Enter valid Pakistani mobile: 03XXXXXXXXX' });
      return;
    }

    const cityDisplay = isOtherCity && data.cityOther?.trim() ? data.cityOther.trim() : data.city;

    setIsSubmitting(true);
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          fullName: data.fullName,
          phone: data.phone,
          city: data.city,
          cityOther: data.cityOther,
          address: data.address,
        }),
      );

      const trackItems = items.map((i) => ({
        id: i.product.id,
        price: i.variant?.optionPrice ?? i.product.price,
        quantity: i.quantity,
      }));

      /* POST /orders — API expects camelCase (Zod placeOrderSchema); subtotal/delivery/total are computed server-side. */
      const payload = {
        storeId: store.id,
        customerName: data.fullName,
        customerPhone: rawPhone,
        customerCity: cityDisplay,
        customerAddress: data.address,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod === 'cod' ? 'cod' : onlineMethod,
        couponCode: appliedCoupon?.code?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };

      const resp = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const created = (await resp.json().catch(() => ({}))) as { id?: string; error?: string | Record<string, unknown> };
      if (!resp.ok || !created?.id) {
        const rawErr = created?.error;
        let errMsg = 'Failed to place order';
        if (typeof rawErr === 'string') errMsg = rawErr;
        else if (rawErr && typeof rawErr === 'object' && 'formErrors' in rawErr) {
          errMsg = 'Please check your order details and try again.';
        } else if (resp.status === 400) {
          errMsg = 'Could not place order. Check stock and details.';
        }
        throw new Error(errMsg);
      }

      trackCompletePayment(trackItems, grandTotal, created.id);

      if (appliedCoupon) {
        applyCouponUsage(appliedCoupon.code);
      }

      setLastOrderId(created.id);
      clearCart();

      onOrderSuccess();
      onOpenChange(false);
      setLocation(`/order-confirmation/${created.id}`);
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Failed to place order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-card text-card-foreground p-0 overflow-hidden max-h-[92dvh] flex flex-col gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black uppercase tracking-wide">Complete Order</DialogTitle>
            <button onClick={() => onOpenChange(false)} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {paymentMethod === 'cod' ? 'Cash on Delivery — Pay when delivered' : 'Online Payment — Verified & Shipped Faster ⚡'}
          </p>

          {/* Welcome back banner */}
          {isReturning && (
            <div className="mt-2 bg-primary/10 text-primary text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2">
              <User size={12} />
              Welcome back, {form.watch('fullName') || 'there'}! Your details are pre-filled.
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* ── Order Summary Card ───────────────────────────────────────── */}
          <div className="mx-4 mt-4 bg-muted/40 border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Summary · {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="px-4 py-2 space-y-2.5 max-h-36 overflow-y-auto">
              {items.map((item, i) => {
                const price = item.variant?.optionPrice ?? item.product.price;
                const parts = [item.variant?.size, item.variant?.color, item.variant?.optionName].filter(Boolean);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">{item.product.name}</p>
                      {parts.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">{parts.join(' · ')} · Qty {item.quantity}</p>
                      )}
                      {parts.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <span className="font-black text-sm text-primary flex-shrink-0">Rs. {price * item.quantity}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="px-4 py-3 border-t border-border/50 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs. {itemTotal}</span>
              </div>

              {/* Coupon discount row */}
              {appliedCoupon && (
                <div className="flex justify-between text-xs items-center">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                    <Tag size={10} />
                    {appliedCoupon.code}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-black">
                    −Rs. {appliedCoupon.discount}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck size={11} /> Delivery
                </span>
                {effectiveDelivery === 0
                  ? <span className="text-green-600 dark:text-green-400 font-bold">FREE</span>
                  : <span>Rs. {effectiveDelivery}</span>
                }
              </div>
              {freeDelivery && !appliedCoupon && (
                <p className="text-[10px] text-green-600 dark:text-green-400">
                  Free delivery on orders above Rs. {freeDeliveryThreshold.toLocaleString()}
                </p>
              )}
              <div className="flex justify-between font-black text-base pt-1.5 border-t border-border">
                <span>Total</span>
                <span className="text-primary">Rs. {grandTotal}</span>
              </div>
              {appliedCoupon && (
                <p className="text-[10px] text-green-600 dark:text-green-400 text-right font-bold">
                  You're saving Rs. {appliedCoupon.discount}! 🎉
                </p>
              )}
              {/* Payment method row in summary */}
              <div className="flex justify-between text-xs pt-1 text-muted-foreground">
                <span>Payment</span>
                <span className="font-bold text-foreground">
                  {paymentMethod === 'cod' ? '💵 Cash on Delivery' :
                    onlineMethod === 'jazzcash' ? '📱 JazzCash' :
                    onlineMethod === 'easypaisa' ? '📱 Easypaisa' : '🏦 Bank Transfer'}
                </span>
              </div>
              {paymentMethod === 'online' && transactionId.trim() && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Transaction ID</span>
                  <span className="font-mono font-bold text-foreground truncate max-w-[120px]">{transactionId.trim()}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Payment Method Selection ──────────────────────────────── */}
          <div className="mx-4 mt-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard size={12} /> Select Payment Method
            </p>

            {/* COD / Online Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                data-testid="button-payment-cod"
                className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-left
                  ${paymentMethod === 'cod'
                    ? 'border-primary bg-primary/8 shadow-sm shadow-primary/10'
                    : 'border-border hover:border-primary/40 bg-muted/30'
                  }`}
              >
                <span className="text-2xl">💵</span>
                <div>
                  <p className="font-black text-xs">Cash on Delivery</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Pay when you receive</p>
                </div>
                {paymentMethod === 'cod' && <CheckIcon size={14} className="text-primary absolute top-2 right-2" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                data-testid="button-payment-online"
                className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-left
                  ${paymentMethod === 'online'
                    ? 'border-emerald-500 bg-emerald-500/8 shadow-sm shadow-emerald-500/10'
                    : 'border-border hover:border-emerald-500/40 bg-muted/30'
                  }`}
              >
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-black text-xs">Online Payment</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">JazzCash / Easypaisa</p>
                </div>
                {paymentMethod === 'online' && <CheckIcon size={14} className="text-emerald-500 absolute top-2 right-2" />}
              </button>
            </div>

            {/* Online Payment Panel */}
            {paymentMethod === 'online' && (
              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">

                {/* Sub-method tabs */}
                <div className="flex gap-2">
                  {([
                    { key: 'jazzcash',  label: 'JazzCash',  abbr: 'JC', bg: 'bg-[#F15A22]' },
                    { key: 'easypaisa', label: 'Easypaisa', abbr: 'EP', bg: 'bg-[#16A34A]' },
                    { key: 'bank',      label: 'Bank',      abbr: '🏦', bg: 'bg-blue-600' },
                  ] as const).map(m => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setOnlineMethod(m.key)}
                      data-testid={`button-online-${m.key}`}
                      className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all
                        ${onlineMethod === m.key
                          ? 'border-emerald-500 bg-card shadow-sm'
                          : 'border-border bg-muted/30 text-muted-foreground hover:border-emerald-500/30'
                        }`}
                    >
                      <span className={`w-6 h-6 ${m.bg} rounded-full flex items-center justify-center text-white text-[9px] font-black flex-shrink-0`}>
                        {m.abbr}
                      </span>
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* JazzCash / Easypaisa details */}
                {(onlineMethod === 'jazzcash' || onlineMethod === 'easypaisa') && (
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {onlineMethod === 'jazzcash' ? '📱 JazzCash Number' : '📱 Easypaisa Number'}
                        </p>
                        <p className="text-sm font-black tracking-wider">
                          {onlineMethod === 'jazzcash' ? STORE_CONFIG.payment.jazzCashNumber : STORE_CONFIG.payment.easypaisaNumber}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Account: {STORE_CONFIG.payment.accountTitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyNumber(onlineMethod === 'jazzcash' ? STORE_CONFIG.payment.jazzCashNumber : STORE_CONFIG.payment.easypaisaNumber)}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        title="Copy number"
                      >
                        {copiedNumber ? <CheckIcon size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="bg-primary/8 border border-primary/20 rounded-lg px-3 py-2 text-xs font-bold text-primary">
                      Send Rs. {grandTotal.toLocaleString()} → {STORE_CONFIG.payment.accountTitle}
                    </div>
                  </div>
                )}

                {/* Bank Transfer details */}
                {onlineMethod === 'bank' && (
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    {[
                      { label: 'Bank Name',      value: STORE_CONFIG.payment.bankName },
                      { label: 'Account Title',  value: STORE_CONFIG.payment.bankAccountTitle },
                      { label: 'Account Number', value: STORE_CONFIG.payment.bankAccountNumber },
                      { label: 'IBAN',           value: STORE_CONFIG.payment.bankIBAN },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-black font-mono">{row.value}</span>
                      </div>
                    ))}
                    <div className="mt-1 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2 text-xs font-bold text-primary">
                      Transfer Rs. {grandTotal.toLocaleString()} → {STORE_CONFIG.payment.bankAccountTitle}
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="Enter your transaction / reference ID"
                    data-testid="input-transaction-id"
                    className="w-full h-9 px-3 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    After sending payment, enter the transaction ID above
                  </p>
                </div>

                {/* Screenshot Upload (display only) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Payment Screenshot (optional)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-dashed border-border rounded-md hover:border-primary/50 transition-colors bg-muted/30">
                    <Upload size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                      {screenshotName || 'Click to choose screenshot'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-screenshot"
                      onChange={e => setScreenshotName(e.target.files?.[0]?.name || '')}
                    />
                  </label>
                </div>

                {/* Speed note */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚡ Online payment orders are shipped within 24 hours! COD orders may take 1-2 extra days for verification.
                </div>
              </div>
            )}
          </div>

          {/* ── Form ─────────────────────────────────────────────────────── */}
          <Form {...form}>
            <form id="cod-form" onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-4 space-y-3.5 pb-2">

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <User size={11} /> Full Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ali Khan" autoComplete="name" {...field} data-testid="input-fullname" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={11} /> Phone Number *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="03XX-XXXXXXX"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={field.value}
                        onChange={e => {
                          const formatted = formatPhoneDisplay(e.target.value);
                          field.onChange(formatted);
                        }}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* City dropdown */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={11} /> City *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          {...field}
                          className="w-full h-10 px-3 pr-8 bg-background border border-input rounded-md text-sm appearance-none outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                          data-testid="select-city"
                        >
                          <option value="">— Select your city —</option>
                          {CITIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* "Other" city text input */}
              {isOtherCity && (
                <FormField
                  control={form.control}
                  name="cityOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Enter your city name" {...field} data-testid="input-city-other" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}

              {/* Delivery estimate pill */}
              {cityInfo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  <Clock size={12} className="text-primary flex-shrink-0" />
                  <span>
                    Estimated delivery to <strong className="text-foreground">{selectedCity}</strong>:{' '}
                    <span className="text-primary font-bold">{cityInfo.days}</span>
                  </span>
                </div>
              )}

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider">Full Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="House #, Street, Block, Area..."
                        rows={2}
                        className="resize-none text-sm"
                        autoComplete="street-address"
                        {...field}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Notes — collapsed by default */}
              {!notesOpen ? (
                <button
                  type="button"
                  onClick={() => setNotesOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  <StickyNote size={11} />
                  Add delivery notes (optional)
                </button>
              ) : (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <StickyNote size={11} /> Delivery Notes (optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Gate code, landmark, special instructions..."
                          rows={2}
                          className="resize-none text-sm"
                          {...field}
                          data-testid="input-notes"
                          autoFocus
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

            </form>
          </Form>
        </div>

        {/* ── Submit Button ─────────────────────────────────────────────────── */}
        <div className="px-4 pb-5 pt-3 border-t border-border bg-card flex-shrink-0">
          {form.formState.errors.root?.message && (
            <p className="text-sm text-destructive font-medium mb-3" role="alert">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button
            type="submit"
            form="cod-form"
            className="w-full h-13 text-base font-black uppercase tracking-wider shadow-lg shadow-primary/20"
            disabled={isSubmitting || items.length === 0}
            data-testid="button-submit-order"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              paymentMethod === 'cod'
              ? `Place Order — Rs. ${grandTotal}`
              : `Confirm Order — Rs. ${grandTotal}`
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            {paymentMethod === 'cod'
              ? 'Pay on delivery — no payment needed now'
              : 'Your order will be confirmed after payment verification'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
