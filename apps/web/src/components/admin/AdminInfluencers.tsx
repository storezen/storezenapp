import { useEffect, useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { API_URL, REF_BASE_URL } from '../../config';

type Influencer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  refCode: string;
  commissionPercent: string | number;
  totalClicks: number;
  totalOrders: number;
  totalCommission: string | number;
  isActive: boolean;
};

export function AdminInfluencers({ token }: { token: string }) {
  const [rows, setRows] = useState<Influencer[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', commissionPercent: 10 });

  async function load() {
    const resp = await fetch(`${API_URL}/influencers`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) setRows(Array.isArray(data?.influencers) ? data.influencers : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addInfluencer() {
    await fetch(`${API_URL}/influencers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setForm({ name: '', phone: '', email: '', commissionPercent: 10 });
    await load();
  }

  async function markPaid(id: string) {
    await fetch(`${API_URL}/influencers/${id}/payout`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`${API_URL}/influencers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await load();
  }

  function getRefLink(refCode: string) {
    if (REF_BASE_URL) {
      const clean = REF_BASE_URL.replace(/\/+$/, '');
      return `${clean}/ref/${encodeURIComponent(refCode)}`;
    }
    if (API_URL) {
      const root = API_URL.replace(/\/api\/?$/, '');
      return `${root}/api/ref/${encodeURIComponent(refCode)}`;
    }
    return `${window.location.origin}/api/ref/${encodeURIComponent(refCode)}`;
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> Add Influencer</h3>
        <div className="grid sm:grid-cols-4 gap-2">
          <input className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          <input className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <input type="number" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" placeholder="Commission %" value={form.commissionPercent} onChange={(e) => setForm((s) => ({ ...s, commissionPercent: Number(e.target.value) }))} />
        </div>
        <button onClick={addInfluencer} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Create</button>
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Ref Link</th>
              <th className="px-3 py-2 text-left">Clicks</th>
              <th className="px-3 py-2 text-left">Orders</th>
              <th className="px-3 py-2 text-left">Commission</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const link = getRefLink(r.refCode);
              return (
                <tr key={r.id} className="border-b border-gray-800/60">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">{link}</span>
                      <button onClick={() => navigator.clipboard.writeText(link)} className="p-1.5 bg-gray-800 rounded-lg"><Copy size={12} /></button>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.totalClicks}</td>
                  <td className="px-3 py-2">{r.totalOrders}</td>
                  <td className="px-3 py-2">Rs. {Number(r.totalCommission ?? 0).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => markPaid(r.id)} className="text-xs bg-emerald-900/40 px-2 py-1 rounded-lg">Mark Paid</button>
                      <button onClick={() => remove(r.id)} className="text-xs bg-rose-900/40 px-2 py-1 rounded-lg">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
