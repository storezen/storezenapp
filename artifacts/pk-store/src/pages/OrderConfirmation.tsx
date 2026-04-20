import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, Copy, MapPin, Phone, Package, Truck, ArrowRight, Clock, HelpCircle } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import {
  getLastOrderId,
  getOrderById,
  getStatusIndex,
  STATUS_STEPS,
  type StoredOrder,
  type OrderStatus,
} from '../lib/orders';
import { STORE_CONFIG } from '../config';
import { useSeo } from '../hooks/useSeo';
import { CustomersAlsoBought } from '../components/Recommendations';

/* ── Status Tracker ──────────────────────────────────────────────────────── */
function StatusTracker({ status }: { status: OrderStatus }) {
  const currentIdx = getStatusIndex(status);

  return (
    <div className="py-6">
      {/* Desktop horizontal tracker */}
      <div className="hidden sm:flex items-start justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-muted" />
        {/* Progress line */}
        <motion.div
          className="absolute top-5 left-[10%] h-0.5 bg-green-500"
          initial={{ width: 0 }}
          animate={{
            width: currentIdx === 0
              ? '0%'
              : `${(currentIdx / (STATUS_STEPS.length - 1)) * 80}%`
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
        />
        {STATUS_STEPS.map((step, idx) => {
          const done    = idx <= currentIdx;
          const current = idx === currentIdx;
          const past    = idx < currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1 z-10">
              <motion.div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-card border-muted text-muted-foreground'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {past ? (
                  <CheckCircle size={18} className="text-white" />
                ) : (
                  <span>{step.icon}</span>
                )}
              </motion.div>
              <div className="text-center">
                <p className={`text-[11px] font-bold leading-tight ${done ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {current && (
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Active</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical tracker */}
      <div className="flex flex-col gap-0 sm:hidden">
        {STATUS_STEPS.map((step, idx) => {
          const done    = idx <= currentIdx;
          const current = idx === currentIdx;
          const past    = idx < currentIdx;
          const last    = idx === STATUS_STEPS.length - 1;
          return (
            <div key={step.key} className="flex gap-4 items-start">
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-base ${
                    done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-card border-muted text-muted-foreground'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  {past ? <CheckCircle size={16} className="text-white" /> : step.icon}
                </motion.div>
                {!last && (
                  <div className={`w-0.5 flex-1 min-h-[28px] my-1 ${idx < currentIdx ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
              <div className="pt-1.5 pb-4">
                <p className={`text-sm font-bold ${done ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {current && (
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Current Status</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function OrderConfirmation() {
  useSeo({ title: 'Order Confirmed — SmartWear' });

  const [, setLocation] = useLocation();
  const [order, setOrder]     = useState<StoredOrder | null>(null);
  const [copied, setCopied]   = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Try URL param first, then localStorage last order
    const params  = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const id      = paramId || getLastOrderId();
    if (!id) { setNotFound(true); return; }
    const found = getOrderById(id);
    if (found) {
      setOrder(found);
    } else {
      setNotFound(true);
    }
  }, []);

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openWhatsAppHelp = () => {
    if (!order) return;
    const msg = encodeURIComponent(`Hi! I need help with my order ${order.orderId}. My name is ${order.name}.`);
    window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${msg}`, '_blank');
  };

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="min-h-[100dvh] bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-4">
          <div className="text-5xl">📭</div>
          <h1 className="text-2xl font-black">No Order Found</h1>
          <p className="text-muted-foreground text-sm max-w-xs">We couldn't find a recent order. Please use the Track Order page to search by Order ID or phone number.</p>
          <div className="flex gap-3 mt-2 flex-wrap justify-center">
            <button onClick={() => setLocation('/track-order')} className="px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl">Track Order</button>
            <button onClick={() => setLocation('/')} className="px-6 py-3 border border-border rounded-xl font-bold">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ── Success header ── */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <CheckCircle size={42} />
          </motion.div>
          <h1 className="text-3xl font-black mb-1">Order Placed! 🎉</h1>
          <p className="text-muted-foreground">
            Thank you, <span className="font-bold text-foreground">{order.name.split(' ')[0]}</span>! We'll contact you to confirm.
          </p>
        </motion.div>

        {/* ── Order ID card ── */}
        <motion.div
          className="bg-muted/40 border border-border rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Order ID</p>
            <p className="text-2xl font-black tracking-widest">{order.orderId}</p>
          </div>
          <button
            onClick={copyOrderId}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              copied
                ? 'bg-green-500/10 text-green-600'
                : 'bg-muted hover:bg-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Copy size={13} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </motion.div>

        {/* ── Delivery estimate ── */}
        <motion.div
          className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Clock size={16} className="text-primary flex-shrink-0" />
          <span>
            Expected delivery to <strong>{order.city}</strong>:{' '}
            <span className="text-primary font-black">{order.estimatedDelivery}</span>
          </span>
        </motion.div>

        {/* ── Status Tracker ── */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-6 mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-black text-lg uppercase tracking-tight mb-1">Order Status</h2>
          <p className="text-xs text-muted-foreground mb-4">Updates will be sent via WhatsApp</p>
          <StatusTracker status={order.status} />
        </motion.div>

        {/* ── Order items ── */}
        <motion.div
          className="bg-card border border-border rounded-2xl overflow-hidden mb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-black text-base uppercase tracking-tight flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Your Items
            </h2>
          </div>
          <div className="divide-y divide-border">
            {order.items.map((item, i) => {
              const parts = [item.variant?.size, item.variant?.color, item.variant?.optionName].filter(Boolean);
              return (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight">{item.productName}</p>
                    {parts.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{parts.join(' · ')} · Qty {item.quantity}</p>
                    )}
                    {parts.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                    )}
                  </div>
                  <p className="font-black text-sm text-primary flex-shrink-0">Rs. {item.price * item.quantity}</p>
                </div>
              );
            })}
          </div>
          {/* Totals */}
          <div className="px-5 py-4 border-t border-border space-y-2 bg-muted/20">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>Rs. {order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><Truck size={12} /> Delivery</span>
              {order.deliveryCharge === 0
                ? <span className="text-green-600 font-bold">FREE</span>
                : <span>Rs. {order.deliveryCharge}</span>
              }
            </div>
            <div className="flex justify-between font-black text-lg pt-2 border-t border-border">
              <span>Total (COD)</span>
              <span className="text-primary">Rs. {order.grandTotal}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Delivery info ── */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-5 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="font-black text-base uppercase tracking-tight mb-3 flex items-center gap-2">
            <MapPin size={15} className="text-primary" />
            Delivery Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 flex-shrink-0">Name</span>
              <span className="font-bold">{order.name}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 flex-shrink-0 flex items-center gap-1"><Phone size={11} /></span>
              <span className="font-bold">{order.phone}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 flex-shrink-0">City</span>
              <span className="font-bold">{order.city}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-16 flex-shrink-0">Address</span>
              <span className="text-foreground/80">{order.address}</span>
            </div>
            {order.notes && (
              <div className="flex gap-3">
                <span className="text-muted-foreground w-16 flex-shrink-0">Notes</span>
                <span className="text-foreground/80 italic">{order.notes}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setLocation(`/track-order?id=${order.orderId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/90 transition-colors"
            data-testid="btn-track-order"
          >
            <ArrowRight size={16} />
            Track Your Order
          </button>
          <button
            onClick={openWhatsAppHelp}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-border font-bold rounded-xl hover:bg-muted transition-colors text-sm"
            data-testid="btn-whatsapp-help"
          >
            <HelpCircle size={15} />
            Need Help?
          </button>
          <button
            onClick={() => setLocation('/')}
            className="flex-1 py-3.5 border border-border font-bold rounded-xl hover:bg-muted transition-colors text-sm"
            data-testid="btn-continue-shopping"
          >
            Continue Shopping
          </button>
        </motion.div>

        {/* ── Customers Also Bought ── */}
        <CustomersAlsoBought
          orderedProductIds={order.items.map(i => i.productId)}
        />
      </div>
    </div>
  );
}
