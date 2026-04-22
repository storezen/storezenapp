import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, MessageCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../hooks/use-toast';

type OrderRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  total: string | number;
  orderStatus: string;
  createdAt: string;
};

type OrderStats = {
  totalOrders?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  newOrders?: number;
  confirmedOrders?: number;
  shippedOrders?: number;
  deliveredOrders?: number;
};

const STATUS_OPTIONS = ['new', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'] as const;

function waLink(phone: string, text: string) {
  const n = phone.replace(/\D/g, '');
  if (!n) return '#';
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function AdminOrders({ token }: { token: string }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '200' });
      const resp = await fetch(`${API_URL}/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await resp.json().catch(() => ({}))) as {
        orders?: OrderRow[];
        stats?: OrderStats;
        error?: string;
      };
      if (!resp.ok) {
        toast({
          title: 'Orders',
          description: String(data?.error ?? 'Could not load orders'),
          variant: 'destructive',
        });
        setOrders([]);
        setStats(null);
        return;
      }
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setStats(data?.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const displayStats = useMemo(() => {
    if (stats) {
      return {
        new: stats.newOrders ?? stats.pendingOrders ?? 0,
        confirmed: stats.confirmedOrders ?? 0,
        shipped: stats.shippedOrders ?? 0,
        delivered: stats.deliveredOrders ?? 0,
      };
    }
    const map = { new: 0, confirmed: 0, shipped: 0, delivered: 0 };
    orders.forEach((o) => {
      const s = o.orderStatus;
      if (s === 'new') map.new += 1;
      else if (s === 'confirmed') map.confirmed += 1;
      else if (s === 'shipped' || s === 'out_for_delivery') map.shipped += 1;
      else if (s === 'delivered') map.delivered += 1;
    });
    return map;
  }, [stats, orders]);

  async function updateStatus(id: string, status: string) {
    const resp = await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      toast({
        title: 'Update failed',
        description: String(data?.error ?? 'Could not update status'),
        variant: 'destructive',
      });
      return;
    }
    await loadOrders();
    toast({ title: 'Status updated' });
  }

  async function exportCsv() {
    try {
      const resp = await fetch(`${API_URL}/orders/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        toast({
          title: 'Export failed',
          description: String(data?.error ?? 'Could not export'),
          variant: 'destructive',
        });
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export started', description: 'orders.csv downloaded.' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500">New</p>
          <p className="text-2xl font-black">{displayStats.new}</p>
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Confirmed</p>
          <p className="text-2xl font-black">{displayStats.confirmed}</p>
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Shipped</p>
          <p className="text-2xl font-black">{displayStats.shipped}</p>
        </div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-2xl font-black">{displayStats.delivered}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => exportCsv()}
          className="flex items-center gap-1.5 text-xs bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700"
        >
          <Download size={12} /> CSV Export
        </button>
        <button
          type="button"
          onClick={() => loadOrders()}
          className="text-xs bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={5}>
                  <Loader2 className="inline w-5 h-5 animate-spin mr-2 align-middle" />
                  Loading orders…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-800/60">
                  <td className="px-3 py-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="px-3 py-2">
                    <p>{o.customerName}</p>
                    <p className="text-xs text-gray-500">{o.customerPhone}</p>
                  </td>
                  <td className="px-3 py-2">Rs. {Number(o.total ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="bg-[#0d0d1a] border border-gray-800 rounded-lg px-2 py-1 text-xs max-w-[140px]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={waLink(
                        o.customerPhone,
                        `Assalam o Alaikum ${o.customerName}! Update for order ${o.id.slice(0, 8)}… — Status: ${o.orderStatus}. Total: Rs. ${Number(o.total ?? 0).toLocaleString()}`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 bg-emerald-900/30 rounded-lg hover:bg-emerald-900/50"
                      title="WhatsApp customer"
                    >
                      <MessageCircle size={12} />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
