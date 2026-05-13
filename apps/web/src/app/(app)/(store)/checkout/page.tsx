"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Truck, RotateCcw, ShieldCheck, CreditCard, CheckCircle2, Tag, AlertCircle, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CITIES, DELIVERY_FEE, FREE_SHIPPING_MIN_SUBTOTAL, PAYMENT_METHODS, WHATSAPP } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackPurchase } from "@/lib/analytics";
import { useOptionalPublicStore } from "@/contexts/PublicStoreContext";
import { getPublicStoreBySlug } from "@/services/catalog.service";
import { placeOrderRequest } from "@/services/checkout.service";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.startsWith("92")) return formatPhone("0" + digits.slice(2));
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

async function resolveStoreId(priority?: string | null) {
  if (priority) return priority;
  const store = await getPublicStoreBySlug(STORE_SLUG);
  return store?.id ?? null;
}

function PageHeader({ step }: { step: 1 | 2 | 3 }) {
  if (step === 3) return null;

  const titles = { 1: "Checkout", 2: "Review Order" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
          <ShoppingBag className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {titles[step]}
          </h1>
          <p className="text-xs text-zinc-500">
            Step {step} of 2
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TrustBadges() {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-zinc-400">Why Shop With Us</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <Truck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Free Delivery</p>
            <p className="text-[10px] text-zinc-500">{formatCurrency(FREE_SHIPPING_MIN_SUBTOTAL)}+ orders</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Cash on Delivery</p>
            <p className="text-[10px] text-zinc-500">Pay on delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <RotateCcw className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Easy Returns</p>
            <p className="text-[10px] text-zinc-500">7 day policy</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">100% Secure</p>
            <p className="text-[10px] text-zinc-500">100% authentic</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({ items, total, deliveryFee, grand, onAction, actionLabel, actionLoading }: {
  items: any[];
  total: number;
  deliveryFee: number;
  grand: number;
  onAction?: (e?: any) => void;
  actionLabel?: string;
  actionLoading?: boolean;
}) {
  return (
    <div className="sticky top-24 rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
      <div className="border-b border-zinc-100/60 px-5 py-4">
        <h2 className="text-base font-bold text-zinc-900">Order Summary</h2>
      </div>

      <div className="max-h-[160px] overflow-y-auto px-5 py-4">
        {items.map((item) => (
          <div key={item.lineKey} className="flex items-center gap-3 py-2">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {item.image ? (
                <img src={item.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-4 w-4 text-zinc-300" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-900">{item.name}</p>
              <p className="text-[10px] text-zinc-500">x{item.qty}</p>
            </div>
            <p className="text-xs font-semibold text-zinc-900 tabular-nums">{formatCurrency(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100/60 px-5 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Subtotal ({items.length} items)</span>
            <span className="font-medium text-zinc-900 tabular-nums">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Delivery</span>
            <span className={cn("font-medium tabular-nums", deliveryFee === 0 ? "text-emerald-600" : "text-zinc-900")}>
              {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100/60 pt-2">
            <span className="text-base font-bold text-zinc-900">Total</span>
            <span className="text-lg font-bold text-zinc-900 tabular-nums">{formatCurrency(grand)}</span>
          </div>
        </div>

        {onAction && actionLabel && (
          <Button onClick={onAction} disabled={actionLoading} className="mt-4 h-12 w-full rounded-xl text-[15px] font-bold shadow-lg shadow-zinc-900/10" size="lg">
            {actionLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                Processing...
              </span>
            ) : actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const publicStore = useOptionalPublicStore();
  const storeIdFromContext = publicStore?.store?.id;

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(CITIES[0] ?? "Karachi");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]?.id ?? "cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [orderId, setOrderId] = useState("");

  const deliveryFee = total >= FREE_SHIPPING_MIN_SUBTOTAL ? 0 : DELIVERY_FEE;
  const grand = useMemo(() => total + deliveryFee, [total, deliveryFee]);

  useEffect(() => {
    const saved = localStorage.getItem("checkout-form");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.name) setName(data.name);
        if (data.phone) setPhone(data.phone);
        if (data.city) setCity(data.city);
        if (data.address) setAddress(data.address);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("checkout-form", JSON.stringify({ name, phone, city, address }));
  }, [name, phone, city, address]);

  function validateForm() {
    if (!name.trim()) return setError("Enter your name"), false;
    const clean = phone.replace(/\D/g, "");
    if (!/^(0)?3[0-9]{9}$/.test(clean)) return setError("Enter valid phone (e.g. 03001234567)"), false;
    if (!address.trim() || address.trim().length < 5) return setError("Enter full address"), false;
    setError("");
    return true;
  }

  function goToReview() {
    if (validateForm()) setStep(2);
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return setError("Cart is empty");

    setBusy(true);
    setError("");

    try {
      const storeId = await resolveStoreId(storeIdFromContext);
      if (!storeId) throw new Error("Store not configured");

      const res = await placeOrderRequest({
        storeId,
        customerName: name,
        customerPhone: phone.replace(/\D/g, ""),
        customerCity: city,
        customerAddress: address,
        items: items.map((i) => ({
          productId: i.product_id,
          quantity: i.qty,
          variantId: i.variantId,
        })),
        paymentMethod: payment,
        couponCode: couponCode || undefined,
      });

      const data = res as { order?: { id: string }; id?: string };
      const newOrderId = data.order?.id || data.id || "";
      setOrderId(newOrderId);
      trackPurchase(newOrderId, grand);
      localStorage.removeItem("checkout-form");
      clearCart();
      setStep(3);
      setTimeout(() => router.push(`/order-confirmation/${newOrderId}`), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setBusy(false);
    }
  }

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="mx-auto max-w-md px-4 pt-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </motion.div>
        <h1 className="text-2xl font-bold text-zinc-900">Order Placed!</h1>
        {orderId && <p className="mt-2 text-sm text-zinc-500">Order ID: {orderId}</p>}
        <p className="mt-4 text-sm text-zinc-500">We will call you within 24 hours to confirm your delivery.</p>
        <div className="mt-6 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-emerald-500" style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">Redirecting...</p>
        {WHATSAPP && (
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            Need help? Chat on WhatsApp
          </a>
        )}
      </div>
    );
  }

  // Step 2: Review
  if (step === 2) {
    return (
      <div className="pb-12 pt-4 md:pt-6">
        <div className="shop-container pt-8 md:pt-10">
          <PageHeader step={2} />

          <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
            <div className="space-y-4">
              {/* Delivery */}
              <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100/60 px-5 py-4">
                  <h3 className="text-sm font-bold text-zinc-900">Delivery Details</h3>
                  <button onClick={() => setStep(1)} className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700">Edit</button>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold text-zinc-900">{name}</p>
                    <p className="text-zinc-600">{phone}</p>
                    <p className="text-zinc-600">{address}</p>
                    <p className="text-zinc-500">{city}</p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100/60 px-5 py-4">
                  <h3 className="text-sm font-bold text-zinc-900">Payment Method</h3>
                  <button onClick={() => setStep(1)} className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700">Edit</button>
                </div>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Cash on Delivery</p>
                    <p className="text-xs text-zinc-500">Pay when you receive</p>
                  </div>
                  <Badge variant="success" className="ml-auto text-[10px]">Popular</Badge>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
                <div className="border-b border-zinc-100/60 px-5 py-4">
                  <h3 className="text-sm font-bold text-zinc-900">Items ({items.length})</h3>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.lineKey} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-600">{item.name} × {item.qty}</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <OrderSummaryCard
                items={items}
                total={total}
                deliveryFee={deliveryFee}
                grand={grand}
                onAction={placeOrder}
                actionLabel={busy ? "Placing Order..." : `Place Order · ${formatCurrency(grand)}`}
                actionLoading={busy}
              />
              <TrustBadges />
              {WHATSAPP && (
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Form
  return (
    <div className="pb-12 pt-4 md:pt-6">
      <div className="shop-container pt-8 md:pt-10">
        <PageHeader step={1} />

        <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
          <form onSubmit={(e) => { e.preventDefault(); goToReview(); }} className="space-y-4">
            {/* Delivery */}
            <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
              <div className="border-b border-zinc-100/60 px-5 py-4">
                <h2 className="text-sm font-bold text-zinc-900">Delivery Information</h2>
              </div>
              <div className="space-y-4 px-5 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Full Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Phone</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="0300 123 4567"
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm"
                  >
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-600">Address</label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Street, Area, Near Landmark"
                    rows={2}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm">
              <div className="border-b border-zinc-100/60 px-5 py-4">
                <h2 className="text-sm font-bold text-zinc-900">Payment Method</h2>
              </div>
              <div className="space-y-2 px-5 py-4">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayment(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                      payment === m.id ? "border-emerald-500 bg-emerald-50" : "border-zinc-100 hover:border-zinc-200"
                    )}
                  >
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", payment === m.id ? "border-emerald-500 bg-emerald-500" : "border-zinc-300")}>
                      {payment === m.id && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm font-medium text-zinc-900">{m.label}</span>
                    {m.id === "cod" && <Badge variant="success" className="ml-auto text-[10px]">Popular</Badge>}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="flex items-center gap-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
              <Tag className="h-5 w-5 shrink-0 text-zinc-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-700">Discount code?</p>
                {showCoupon && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm uppercase"
                    />
                    <Button type="button" size="sm" onClick={() => setCouponApplied(true)}>Apply</Button>
                  </div>
                )}
                {couponApplied && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Coupon applied!
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setShowCoupon(!showCoupon)} className="whitespace-nowrap text-xs font-medium text-emerald-600">
                {showCoupon ? "Cancel" : couponApplied ? "Change" : "Add"}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200/60 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}
          </form>

          {/* Sidebar */}
          <div className="space-y-4">
            <OrderSummaryCard
              items={items}
              total={total}
              deliveryFee={deliveryFee}
              grand={grand}
              onAction={goToReview}
              actionLabel="Continue to Review"
              actionLoading={busy}
            />
            <TrustBadges />
            {WHATSAPP && (
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
