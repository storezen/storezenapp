import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck, LogOut, Search, Download, Package, TrendingUp,
  Clock, AlertCircle, MessageCircle, Copy, ChevronDown, Eye,
  Check, RefreshCw, Filter, BarChart3, Truck, CheckCircle2, XCircle,
  ShoppingBag,
} from 'lucide-react';
import { STORE_CONFIG } from '../config';
import {
  getAllOrders, updateOrderStatus,
  type StoredOrder, type OrderStatus,
} from '../lib/orders';
import { getWhatsAppTemplate } from '../lib/orders';
import { AdminProducts } from '../components/admin/AdminProducts';

const ADMIN_AUTH_KEY = 'sw_admin_auth';

/* ── Status metadata ─────────────────────────────────────────────────── */
const STATUS_META: Record<OrderStatus, { label: string; color: string; badge: string; icon: React.ReactNode }> = {
  placed:           { label: 'Order Placed',     color: 'text-gray-400',   badge: 'bg-gray-800 text-gray-200 border-gray-700',           icon: <Package size={12} /> },
  confirmed:        { label: 'Confirmed',         color: 'text-amber-400',  badge: 'bg-amber-900/50 text-amber-300 border-amber-700/50',   icon: <Check size={12} /> },
  shipped:          { label: 'Shipped',           color: 'text-blue-400',   badge: 'bg-blue-900/50 text-blue-300 border-blue-700/50',      icon: <Truck size={12} /> },
  out_for_delivery: { label: 'Out for Delivery',  color: 'text-violet-400', badge: 'bg-violet-900/50 text-violet-300 border-violet-700/50',icon: <TrendingUp size={12} /> },
  delivered:        { label: 'Delivered',         color: 'text-emerald-400',badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50', icon: <CheckCircle2 size={12} /> },
  cancelled:        { label: 'Cancelled',         color: 'text-rose-400',   badge: 'bg-rose-900/50 text-rose-300 border-rose-700/50',      icon: <XCircle size={12} /> },
};

const ALL_STATUSES: OrderStatus[] = ['placed','confirmed','shipped','out_for_delivery','delivered','cancelled'];

/* ── CSV export ──────────────────────────────────────────────────────── */
function exportCSV(orders: StoredOrder[]) {
  const header = ['Order ID','Date','Customer','Phone','City','Product','Variant','Qty','Subtotal','Delivery','Total','Status'];
  const rows = orders.map(o => {
    const product = o.items.map(i => i.productName).join(' | ');
    const variant = o.items.map(i => {
      const v = i.variant;
      if (!v) return '';
      return [v.size, v.color, v.optionName].filter(Boolean).join('/');
    }).join(' | ');
    const qty = o.items.reduce((s, i) => s + i.quantity, 0);
    return [
      o.orderId,
      new Date(o.createdAt).toLocaleDateString('en-PK'),
      o.name,
      o.phone,
      o.city,
      product,
      variant || '-',
      qty,
      o.subtotal,
      o.deliveryCharge,
      o.grandTotal,
      STATUS_META[o.status]?.label ?? o.status,
    ];
  });
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `smartwear-orders-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function isToday(iso: string) {
  const d = new Date(iso), n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ── Password Gate ───────────────────────────────────────────────────── */
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === STORE_CONFIG.adminPassword) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      onAuth();
    } else {
      setErr(true);
      setPw('');
      setTimeout(() => setErr(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-white">SmartWear <span className="text-rose-400">Admin</span></span>
          </div>
          <p className="text-gray-500 text-sm">Enter your admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Admin password"
              data-testid="input-admin-password"
              autoFocus
              className={`w-full bg-[#1a1a2e] border rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors
                ${err ? 'border-rose-500 animate-pulse' : 'border-gray-800 focus:border-rose-500'}`}
            />
            {err && <p className="text-rose-400 text-xs mt-1.5 ml-1">❌ Galat password. Dobara try karein.</p>}
          </div>
          <button
            type="submit"
            data-testid="button-admin-login"
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.placed;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${m.badge}`}>
      {m.icon} {m.label}
    </span>
  );
}

/* ── Overview Card ───────────────────────────────────────────────────── */
function OverviewCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-2xl font-black leading-none">{value}</p>
        {sub && <p className="text-gray-600 text-[11px] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Status Dropdown ─────────────────────────────────────────────────── */
function StatusDropdown({ order, onChange }: { order: StoredOrder; onChange: (id: string, s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg transition-colors"
        data-testid={`dropdown-status-${order.orderId}`}
      >
        <RefreshCw size={11} /> Change <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { onChange(order.orderId, s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-700/50 transition-colors flex items-center gap-2
                ${order.status === s ? 'text-white font-bold' : 'text-gray-400'}`}
            >
              {STATUS_META[s].icon} {STATUS_META[s].label}
              {order.status === s && <Check size={10} className="ml-auto text-rose-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Mobile Order Card ───────────────────────────────────────────────── */
function MobileOrderCard({ order, onStatusChange, onCopy, onWhatsApp }: {
  order: StoredOrder;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onCopy: (phone: string) => void;
  onWhatsApp: (order: StoredOrder) => void;
}) {
  const product = order.items[0];
  const variant  = product?.variant ? [product.variant.size, product.variant.color, product.variant.optionName].filter(Boolean).join(' / ') : '';

  return (
    <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-bold text-sm">{order.name}</p>
          <p className="text-gray-500 text-xs">{order.orderId}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Phone</span>
          <p className="text-gray-300">{order.phone}</p>
        </div>
        <div>
          <span className="text-gray-600">Total</span>
          <p className="text-emerald-400 font-bold">Rs. {order.grandTotal.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-600">Product</span>
          <p className="text-gray-300 truncate">{product?.productName ?? '-'}</p>
        </div>
        {variant && (
          <div>
            <span className="text-gray-600">Variant</span>
            <p className="text-gray-300">{variant}</p>
          </div>
        )}
        <div>
          <span className="text-gray-600">Date</span>
          <p className="text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <span className="text-gray-600">City</span>
          <p className="text-gray-300">{order.city}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-800">
        <StatusDropdown order={order} onChange={onStatusChange} />
        <button
          onClick={() => onCopy(order.phone)}
          className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1.5 rounded-lg transition-colors"
          title="Copy phone"
        >
          <Copy size={11} /> Copy
        </button>
        <button
          onClick={() => onWhatsApp(order)}
          className="flex items-center gap-1 text-xs bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] px-2 py-1.5 rounded-lg transition-colors"
          title="Send WhatsApp update"
          data-testid={`button-whatsapp-${order.orderId}`}
        >
          <MessageCircle size={11} /> WhatsApp
        </button>
        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <button
            onClick={() => onStatusChange(order.orderId, 'shipped')}
            className="flex items-center gap-1 text-xs bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 px-2 py-1.5 rounded-lg transition-colors"
          >
            <Truck size={11} /> Ship
          </button>
        )}
        {order.status === 'shipped' || order.status === 'out_for_delivery' ? (
          <button
            onClick={() => onStatusChange(order.orderId, 'delivered')}
            className="flex items-center gap-1 text-xs bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 px-2 py-1.5 rounded-lg transition-colors"
          >
            <CheckCircle2 size={11} /> Deliver
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ── Main Admin Dashboard ────────────────────────────────────────────── */
export default function Admin() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_AUTH_KEY) === 'true');
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders]   = useState<StoredOrder[]>([]);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [copied, setCopied]   = useState<string | null>(null);

  const reload = useCallback(() => {
    const all = getAllOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOrders(all);
  }, []);

  useEffect(() => { if (authed) reload(); }, [authed, reload]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total    = orders.length;
    const revenue  = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.grandTotal, 0);
    const today    = orders.filter(o => isToday(o.createdAt)).length;
    const pending  = orders.filter(o => o.status === 'confirmed' || o.status === 'placed').length;
    return { total, revenue, today, pending };
  }, [orders]);

  /* ── Filtered orders ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      const matchSearch = !q ||
        o.orderId.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      return matchStatus && matchSearch;
    });
  }, [orders, search, filterStatus]);

  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    updateOrderStatus(orderId, newStatus);
    reload();
  }

  function handleCopy(phone: string) {
    copyToClipboard(phone);
    setCopied(phone);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleWhatsApp(order: StoredOrder) {
    const msg = getWhatsAppTemplate(order, order.status === 'placed' ? 'confirmed' : order.status as OrderStatus);
    if (!msg) return;
    const phone = order.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Top bar ── */}
      <header className="bg-[#111118] border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-sm leading-none">SmartWear <span className="text-rose-400">Admin</span></h1>
            <p className="text-gray-600 text-[10px]">Dashboard</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="hidden sm:flex items-center bg-[#0d0d1a] rounded-xl border border-gray-800 p-1 gap-1">
          <button
            onClick={() => setActiveTab('orders')}
            data-testid="tab-orders"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
              ${activeTab === 'orders' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <ShoppingBag size={12} /> Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            data-testid="tab-products"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
              ${activeTab === 'products' ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Package size={12} /> Products
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'orders' && (
            <button
              onClick={() => exportCSV(filtered)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition-colors"
              data-testid="button-export-csv"
            >
              <Download size={13} /> Export Orders
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs bg-rose-900/40 hover:bg-rose-800/50 text-rose-300 px-3 py-2 rounded-lg transition-colors"
            data-testid="button-admin-logout"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="sm:hidden flex items-center bg-[#111118] border-b border-gray-800 px-4 py-2 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors
            ${activeTab === 'orders' ? 'bg-rose-500/20 text-rose-300' : 'text-gray-600'}`}
        >
          <ShoppingBag size={12} /> Orders
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors
            ${activeTab === 'products' ? 'bg-rose-500/20 text-rose-300' : 'text-gray-600'}`}
        >
          <Package size={12} /> Products
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {activeTab === 'products' && <AdminProducts />}

      {activeTab === 'orders' && (<div className="space-y-6">

        {/* ── Overview Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OverviewCard
            icon={<BarChart3 size={20} className="text-white" />}
            label="Total Orders"
            value={stats.total}
            sub={`${filtered.length} shown`}
            color="bg-violet-600/20"
            data-testid="card-total-orders"
          />
          <OverviewCard
            icon={<TrendingUp size={20} className="text-white" />}
            label="Total Revenue"
            value={`Rs. ${stats.revenue.toLocaleString()}`}
            sub="Excl. cancelled"
            color="bg-emerald-600/20"
          />
          <OverviewCard
            icon={<Clock size={20} className="text-white" />}
            label="Orders Today"
            value={stats.today}
            color="bg-blue-600/20"
          />
          <OverviewCard
            icon={<AlertCircle size={20} className="text-white" />}
            label="Pending Orders"
            value={stats.pending}
            sub="Awaiting action"
            color="bg-amber-600/20"
          />
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID, name, or phone…"
              data-testid="input-admin-search"
              className="w-full bg-[#111118] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-rose-500/50 transition-colors"
            />
          </div>

          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as OrderStatus | 'all')}
              data-testid="select-status-filter"
              className="bg-[#111118] border border-gray-800 rounded-xl pl-8 pr-10 py-2.5 text-sm text-gray-300 outline-none focus:border-rose-500/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportCSV(filtered)}
            className="sm:hidden flex items-center justify-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between -mt-3">
          <p className="text-gray-600 text-xs">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>
          {(search || filterStatus !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); }}
              className="text-xs text-rose-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Eye size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">{orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}</p>
            <p className="text-sm mt-1">{orders.length === 0 ? 'Orders will appear here once customers place them.' : 'Try adjusting your search or filter.'}</p>
          </div>
        )}

        {/* ── Desktop Table ── */}
        {filtered.length > 0 && (
          <div className="hidden md:block bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="orders-table">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    {['Order ID','Date','Customer','Phone','Product','Variant','Total','Status','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filtered.map(order => {
                    const product = order.items[0];
                    const variant  = product?.variant
                      ? [product.variant.size, product.variant.color, product.variant.optionName].filter(Boolean).join(' / ')
                      : '';
                    const extraItems = order.items.length - 1;

                    return (
                      <tr key={order.orderId} className="hover:bg-gray-800/20 transition-colors group">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{order.orderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white text-sm">{order.name}</p>
                          <p className="text-gray-600 text-xs">{order.city}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-300 text-xs">{order.phone}</span>
                            <button
                              onClick={() => handleCopy(order.phone)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-300"
                              title="Copy phone"
                            >
                              {copied === order.phone ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[140px]">
                          <p className="text-gray-300 text-xs truncate" title={product?.productName}>{product?.productName ?? '-'}</p>
                          {extraItems > 0 && <p className="text-gray-600 text-[10px]">+{extraItems} more item{extraItems > 1 ? 's' : ''}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{variant || '-'}</td>
                        <td className="px-4 py-3 font-bold text-emerald-400 whitespace-nowrap text-xs">Rs. {order.grandTotal.toLocaleString()}</td>
                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <StatusDropdown order={order} onChange={handleStatusChange} />

                            <button
                              onClick={() => handleWhatsApp(order)}
                              className="flex items-center gap-1 text-xs bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                              title="Send WhatsApp update"
                              data-testid={`button-whatsapp-${order.orderId}`}
                            >
                              <MessageCircle size={11} /> WA
                            </button>

                            {(order.status === 'placed' || order.status === 'confirmed') && (
                              <button
                                onClick={() => handleStatusChange(order.orderId, 'shipped')}
                                className="flex items-center gap-1 text-xs bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                title="Mark as shipped"
                                data-testid={`button-ship-${order.orderId}`}
                              >
                                <Truck size={11} /> Ship
                              </button>
                            )}

                            {(order.status === 'shipped' || order.status === 'out_for_delivery') && (
                              <button
                                onClick={() => handleStatusChange(order.orderId, 'delivered')}
                                className="flex items-center gap-1 text-xs bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-300 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                title="Mark as delivered"
                                data-testid={`button-deliver-${order.orderId}`}
                              >
                                <CheckCircle2 size={11} /> Deliver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Mobile Card View ── */}
        {filtered.length > 0 && (
          <div className="md:hidden space-y-3">
            {filtered.map(order => (
              <MobileOrderCard
                key={order.orderId}
                order={order}
                onStatusChange={handleStatusChange}
                onCopy={handleCopy}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        )}

        {/* ── Bottom padding ── */}
        <div className="h-8" />
      </div>)}

      </main>
    </div>
  );
}
