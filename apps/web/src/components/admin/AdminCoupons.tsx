import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';

type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed' | 'free_delivery';
  value: string | number;
  minOrder?: string | number | null;
  isActive?: boolean;
};

export function AdminCoupons({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<Coupon['type']>('percent');
  const [value, setValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);

  async function loadCoupons() {
    const resp = await fetch(`${API_URL}/coupons`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function save() {
    const payload = { code, type, value, minOrder };
    if (editing) {
      await fetch(`${API_URL}/coupons/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }
    setEditing(null);
    setCode('');
    setValue(0);
    setMinOrder(0);
    await loadCoupons();
  }

  function beginEdit(c: Coupon) {
    setEditing(c);
    setCode(c.code);
    setType(c.type);
    setValue(Number(c.value ?? 0));
    setMinOrder(Number(c.minOrder ?? 0));
  }

  async function remove(id: string) {
    await fetch(`${API_URL}/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    await loadCoupons();
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={14} /> {editing ? 'Edit Coupon' : 'Add Coupon'}</h3>
        <div className="grid sm:grid-cols-4 gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <select value={type} onChange={(e) => setType(e.target.value as Coupon['type'])} className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed</option>
            <option value="free_delivery">Free Delivery</option>
          </select>
          <input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} placeholder="Value" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))} placeholder="Min order" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button onClick={save} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save Coupon</button>
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">Min</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/60">
                <td className="px-3 py-2 font-mono">{c.code}</td>
                <td className="px-3 py-2">{c.type}</td>
                <td className="px-3 py-2">{Number(c.value ?? 0)}</td>
                <td className="px-3 py-2">{Number(c.minOrder ?? 0)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => beginEdit(c)} className="p-1.5 bg-blue-900/40 rounded-lg"><Pencil size={12} /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 bg-rose-900/40 rounded-lg"><Trash2 size={12} /></button>
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
