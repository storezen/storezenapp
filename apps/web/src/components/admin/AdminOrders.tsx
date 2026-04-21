import { useEffect, useMemo, useState } from 'react';
import { Download, MessageCircle } from 'lucide-react';
import { API_URL } from '../../config';

type OrderRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  total: string | number;
  orderStatus: string;
  createdAt: string;
};

export function AdminOrders({ token }: { token: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  async function loadOrders() {
    const resp = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) setOrders(Array.isArray(data?.orders) ? data.orders : []);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const map = { new: 0, confirmed: 0, shipped: 0, delivered: 0 };
    orders.forEach((o) => {
      const s = o.orderStatus as keyof typeof map;
      if (s in map) map[s] += 1;
    });
    return map;
  }, [orders]);

  async function updateStatus(id: string, status: string) {
    await fetch(`${API_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    await loadOrders();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4"><p className="text-xs text-gray-500">New</p><p className="text-2xl font-black">{stats.new}</p></div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4"><p className="text-xs text-gray-500">Confirmed</p><p className="text-2xl font-black">{stats.confirmed}</p></div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4"><p className="text-xs text-gray-500">Shipped</p><p className="text-2xl font-black">{stats.shipped}</p></div>
        <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4"><p className="text-xs text-gray-500">Delivered</p><p className="text-2xl font-black">{stats.delivered}</p></div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => window.open(`${API_URL}/orders/export`, '_blank')}
          className="flex items-center gap-1.5 text-xs bg-gray-800 px-3 py-2 rounded-lg"
        >
          <Download size={12} /> CSV Export
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
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-800/60">
                <td className="px-3 py-2">{o.id.slice(0, 8)}...</td>
                <td className="px-3 py-2">
                  <p>{o.customerName}</p>
                  <p className="text-xs text-gray-500">{o.customerPhone}</p>
                </td>
                <td className="px-3 py-2">Rs. {Number(o.total ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2">{o.orderStatus}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="bg-[#0d0d1a] border border-gray-800 rounded-lg px-2 py-1 text-xs"
                    >
                      {['new', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => window.open(`https://wa.me/${o.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Order update: ${o.id}`)}`, '_blank')}
                      className="p-1.5 bg-emerald-900/30 rounded-lg"
                      title="WhatsApp template"
                    >
                      <MessageCircle size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
