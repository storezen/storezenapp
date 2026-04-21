import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, MapPin, Phone, Truck, CheckCircle, MessageSquare, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import {
  getStatusIndex,
  STATUS_STEPS,
  getWhatsAppTemplate,
  type StoredOrder,
  type OrderStatus,
} from '../lib/orders';
import { STORE_CONFIG } from '../config';
import { useSeo } from '../hooks/useSeo';
import { API_URL } from '../config';

function toUiOrderStatus(status: string | undefined): OrderStatus {
  if (status === 'new') return 'placed';
  if (status === 'confirmed' || status === 'shipped' || status === 'out_for_delivery' || status === 'delivered' || status === 'cancelled') {
    return status;
  }
  return 'placed';
}

/* ── Status Tracker (shared visual) ────────────────────────────────────── */
function StatusTracker({ status }: { status: OrderStatus }) {
  const currentIdx = getStatusIndex(status);
  return (
    <div className="flex flex-col gap-0">
      {STATUS_STEPS.map((step, idx) => {
        const done    = idx <= currentIdx;
        const current = idx === currentIdx;
        const past    = idx < currentIdx;
        const last    = idx === STATUS_STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-4 items-start">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                done
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-card border-muted text-muted-foreground'
              }`}>
                {past ? <CheckCircle size={15} className="text-white" /> : step.icon}
              </div>
              {!last && (
                <div className={`w-0.5 h-7 my-0.5 ${idx < currentIdx ? 'bg-green-500' : 'bg-muted'}`} />
              )}
            </div>
            <div className="pt-1.5 pb-4">
              <p className={`text-sm font-bold ${done ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {current && (
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Current</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── WhatsApp Templates (for store owner) ──────────────────────────────── */
function OwnerTemplates({ order }: { order: StoredOrder }) {
  const [open, setOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('confirmed');
  const [copied, setCopied] = useState(false);

  const templateStatuses: OrderStatus[] = ['confirmed', 'shipped', 'out_for_delivery', 'delivered'];
  const templateLabels: Record<string, string> = {
    confirmed:        'Confirmed',
    shipped:          'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered:        'Delivered',
  };

  const template = getWhatsAppTemplate(order, activeStatus);

  const copyTemplate = () => {
    navigator.clipboard.writeText(template).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sendTemplate = () => {
    window.open(`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(template)}`, '_blank');
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mt-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
        data-testid="btn-owner-templates-toggle"
      >
        <div className="flex items-center gap-2 text-sm font-bold">
          <MessageSquare size={15} className="text-primary" />
          WhatsApp Message Templates
          <span className="text-xs font-normal text-muted-foreground">(Store Owner)</span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-5 space-y-4">
              {/* Status selector tabs */}
              <div className="flex flex-wrap gap-2">
                {templateStatuses.map(s => (
                  <button
                    key={s}
                    onClick={() => { setActiveStatus(s); setCopied(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      activeStatus === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {templateLabels[s]}
                  </button>
                ))}
              </div>

              {/* Template text */}
              <div className="bg-muted rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed text-foreground/80 font-mono">
                {template}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={copyTemplate}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-muted hover:bg-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Copy size={12} />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={sendTemplate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send on WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Order Result Card ──────────────────────────────────────────────────── */
function OrderCard({ order }: { order: StoredOrder }) {
  const openWhatsAppHelp = () => {
    const msg = encodeURIComponent(
      `Hi! I need help with my order *${order.orderId}*. My name is ${order.name}.`
    );
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
  };

  return (
    <motion.div
      className="space-y-4 mt-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Order ID</p>
            <p className="text-2xl font-black tracking-widest mt-0.5">{order.orderId}</p>
          </div>
          <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wide ${
            order.status === 'delivered'
              ? 'bg-green-500/10 text-green-600'
              : order.status === 'placed'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-amber-500/10 text-amber-600'
          }`}>
            {STATUS_STEPS.find(s => s.key === order.status)?.label ?? order.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Truck size={12} className="text-primary" />
          Estimated delivery to <strong className="text-foreground ml-1">{order.city}</strong>:
          <span className="text-primary font-bold ml-1">{order.estimatedDelivery}</span>
        </div>
      </div>

      {/* Status tracker */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-black text-base uppercase tracking-tight mb-4">Order Status</h3>
        <StatusTracker status={order.status} />
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
            <Package size={14} className="text-primary" />
            Items ({order.items.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {order.items.map((item, i) => {
            const parts = [item.variant?.size, item.variant?.color, item.variant?.optionName].filter(Boolean);
            return (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.productName}</p>
                  {parts.length > 0 && <p className="text-xs text-muted-foreground">{parts.join(' · ')} · Qty {item.quantity}</p>}
                  {parts.length === 0 && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                </div>
                <p className="font-black text-sm text-primary">Rs. {item.price * item.quantity}</p>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-between font-black text-base">
          <span>Total (COD)</span>
          <span className="text-primary">Rs. {order.grandTotal}</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-black text-sm uppercase tracking-tight mb-3 flex items-center gap-2">
          <MapPin size={14} className="text-primary" />
          Delivery Info
        </h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-3"><span className="text-muted-foreground w-16 flex-shrink-0">Name</span><span className="font-bold">{order.name}</span></div>
          <div className="flex gap-3"><span className="text-muted-foreground w-16 flex-shrink-0 flex items-center"><Phone size={11} /></span><span className="font-bold">{order.phone}</span></div>
          <div className="flex gap-3"><span className="text-muted-foreground w-16 flex-shrink-0">City</span><span className="font-bold">{order.city}</span></div>
          <div className="flex gap-3"><span className="text-muted-foreground w-16 flex-shrink-0">Address</span><span className="text-foreground/80">{order.address}</span></div>
        </div>
      </div>

      {/* Need Help */}
      <button
        onClick={openWhatsAppHelp}
        className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-[#25D366]/40 text-[#25D366] font-bold rounded-xl hover:bg-[#25D366]/10 transition-colors"
        data-testid="btn-need-help"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Need Help? Chat on WhatsApp
      </button>

      {/* Owner message templates */}
      <OwnerTemplates order={order} />
    </motion.div>
  );
}

/* ── Main TrackOrder Page ──────────────────────────────────────────────── */
export default function TrackOrder() {
  useSeo({ title: 'Track Your Order — SmartWear' });

  const [query, setQuery]     = useState('');
  const [phone, setPhone]     = useState('');
  const [results, setResults] = useState<StoredOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read ?id= param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const paramPhone = params.get('phone');
    if (paramId) {
      setQuery(paramId);
      if (paramPhone) setPhone(paramPhone);
    }
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    (async () => {
      try {
        const url = new URL(`${API_URL}/orders/track`);
        url.searchParams.set('id', query.trim());
        if (phone.trim()) url.searchParams.set('phone', phone.trim());
        const resp = await fetch(url.toString());
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error ?? 'Order not found');
        const mapped: StoredOrder = {
          orderId: String(data.id),
          name: String(data.customerName ?? ''),
          phone: String(data.customerPhone ?? ''),
          city: String(data.customerCity ?? ''),
          address: String(data.customerAddress ?? ''),
          items: Array.isArray(data.items)
            ? data.items.map((item: Record<string, unknown>) => ({
                productId: String(item.productId ?? ''),
                productName: String(item.name ?? ''),
                productImage: '/placeholder.svg',
                price: Number(item.unitPrice ?? 0),
                quantity: Number(item.quantity ?? 0),
              }))
            : [],
          subtotal: Number(data.subtotal ?? 0),
          deliveryCharge: Number(data.deliveryFee ?? 0),
          grandTotal: Number(data.total ?? 0),
          status: toUiOrderStatus(typeof data.orderStatus === 'string' ? data.orderStatus : undefined),
          createdAt: String(data.createdAt ?? new Date().toISOString()),
          estimatedDelivery: '2-5 days',
          notes: data.notes ? String(data.notes) : undefined,
        };
        setResults([mapped]);
      } catch {
        setResults([]);
      } finally {
        setSearched(true);
      }
    })();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Search size={28} />
          </div>
          <h1 className="text-3xl font-black mb-2">Track Your Order</h1>
          <p className="text-muted-foreground text-sm">Enter your Order ID or registered phone number</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearched(false); }}
              onKeyDown={handleKeyDown}
              placeholder="SW-2026-XXXXX or 03XXXXXXXXX"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="input-track-search"
              autoFocus
            />
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-40 px-3 py-3.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="input-track-phone"
          />
          <button
            type="submit"
            className="px-6 py-3.5 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
            data-testid="btn-track-search"
          >
            Track
          </button>
        </form>
        <p className="text-xs text-muted-foreground mb-6 text-center">
          Orders are stored on this device. Use same phone/browser to track.
        </p>

        {/* Results */}
        <AnimatePresence mode="wait">
          {searched && results.length === 0 && (
            <motion.div
              key="no-results"
              className="text-center py-16 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-5xl">📭</div>
              <p className="font-black text-lg">No Order Found</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Check the Order ID from your confirmation, or ensure you're using the same device you ordered from.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Need help?{' '}
                <a
                  href={`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hi! I can't find my order. My query is: ${query}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline"
                >
                  Contact us on WhatsApp
                </a>
              </p>
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {results.map(order => (
                <OrderCard key={order.orderId} order={order} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state (before search) */}
        {!searched && (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Enter your Order ID to see status</p>
          </div>
        )}
      </div>
    </div>
  );
}
