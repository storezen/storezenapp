"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Minus, Plus, Truck, ShieldCheck, RotateCcw, Lock, ShoppingBag, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CITIES } from "@/lib/constants";
import { useOptionalPublicStore } from "@/contexts/PublicStoreContext";
import { getPublicStoreBySlug } from "@/services/catalog.service";
import { placeOrderRequest } from "@/services/checkout.service";

type QuickOrderProps = {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    sale_price?: number;
    images?: string[];
  };
};

const TRUST_ELEMENTS = [
  { icon: Truck, text: "Cash on Delivery", desc: "Pay at delivery" },
  { icon: RotateCcw, text: "Easy Returns", desc: "7 day policy" },
  { icon: ShieldCheck, text: "Secure Order", desc: "100% authentic" },
  { icon: Lock, text: "No Advance Payment", desc: "Pay only on delivery" },
];

export function QuickOrderModal({ open, onClose, product }: QuickOrderProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(CITIES[0] ?? "Karachi");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  const publicStore = useOptionalPublicStore();
  const storeIdRef = useRef<string | null>(null);
  storeIdRef.current = publicStore?.store?.id ?? null;

  const unitPrice = product.sale_price ?? product.price;
  const total = unitPrice * qty;

  useEffect(() => {
    if (!open) {
      setStep("form");
      setLoading(false);
      setQty(1);
      setName("");
      setPhone("");
      setCity(CITIES[0] ?? "Karachi");
      setAddress("");
      setErrors({});
      setError("");
    }
  }, [open]);

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/\D/g, "");
    return /^(0)?3[0-9]{9}$/.test(clean);
  };

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";
    if (digits.startsWith("92")) {
      const without92 = digits.slice(2);
      return formatPhone("0" + without92);
    }
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    const formatted = formatPhone(rawDigits);
    setPhone(formatted);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { name?: string; phone?: string; address?: string } = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = "Please enter your full name";
    if (!validatePhone(phone)) newErrors.phone = "Please enter a valid phone number (e.g. 03001234567)";
    if (!address.trim() || address.trim().length < 5) newErrors.address = "Please enter your complete address";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      let storeId = storeIdRef.current;
      if (!storeId) {
        const slug = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";
        const store = await getPublicStoreBySlug(slug);
        storeId = store?.id ?? null;
      }

      if (!storeId) {
        setError("Store not found. Please try again.");
        setLoading(false);
        return;
      }

      const res = await placeOrderRequest({
        storeId,
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, ""),
        customerCity: city,
        customerAddress: address.trim(),
        paymentMethod: "cod",
        items: [{ productId: product.id, quantity: qty }],
      });

      const data = res as { id?: string; error?: string };
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open && step === "form") {
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [open, step]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          >
            <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
                    <ShoppingBag className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Quick Order</h2>
                    <p className="text-xs text-zinc-500">Cash on Delivery</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600">
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>

              {step === "form" ? (
                <form onSubmit={handleSubmit} className="max-h-[calc(90vh-140px)] overflow-y-auto p-5">
                  {/* Product Summary */}
                  <div className="mb-4 flex items-center gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-200">
                      <img src={product.images?.[0] || "https://placehold.co/100x100?text=Product"} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{product.name}</p>
                      <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(unitPrice)}</p>
                    </div>
                  </div>

                  {/* Trust Elements */}
                  <div className="mb-5 grid grid-cols-2 gap-2">
                    {TRUST_ELEMENTS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-emerald-100/60 bg-emerald-50/30 p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                          <item.icon className="h-4 w-4 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-900 leading-tight">{item.text}</p>
                          <p className="text-[9px] text-emerald-600 leading-tight">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                        }}
                        placeholder="Your full name"
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={errors.name ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : {}}
                      />
                      {errors.name && <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>}
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="0300 123 4567"
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={errors.phone ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : {}}
                      />
                      {errors.phone && <p className="mt-1 text-xs font-medium text-red-500">{errors.phone}</p>}
                      <p className="mt-1 text-xs text-zinc-400">We will call to confirm your order</p>
                    </div>

                    {/* City */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        Your City <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        Delivery Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
                        }}
                        placeholder="House #, Street, Area, Near Landmark, City"
                        rows={2}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        style={errors.address ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } : {}}
                      />
                      {errors.address && <p className="mt-1 text-xs font-medium text-red-500">{errors.address}</p>}
                      <p className="mt-1 text-xs text-zinc-400">So our delivery partner can find you easily</p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="mb-1.5 text-sm font-semibold text-zinc-700">How Many?</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          disabled={qty <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" strokeWidth={2} />
                        </button>
                        <span className="min-w-[40px] text-center text-lg font-bold text-zinc-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty((q) => q + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Total Amount</p>
                      <p className="text-xs text-emerald-600">Delivery charges included</p>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(total)}</p>
                  </div>

                  {/* Submit */}
                  <Button type="submit" size="xl" className="mt-5 h-14 w-full rounded-xl text-base font-bold" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Placing Order...
                      </span>
                    ) : (
                      <>Place Order · {formatCurrency(total)}</>
                    )}
                  </Button>

                  {error && <p className="mt-3 text-center text-sm font-medium text-red-500">{error}</p>}
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <Check className="h-12 w-12 text-emerald-600" strokeWidth={3} />
                  </motion.div>
                  <h3 className="mt-6 text-xl font-bold text-zinc-900">Order Placed!</h3>
                  <p className="mt-2 max-w-xs text-sm text-zinc-500">
                    Thank you! Our team will call you within 24 hours to confirm your delivery details.
                  </p>
                  <div className="mt-8 flex flex-col gap-3">
                    <Button onClick={onClose} size="xl" className="h-12 rounded-xl font-bold">
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
