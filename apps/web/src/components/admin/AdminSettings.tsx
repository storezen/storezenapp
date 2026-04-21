import { useEffect, useState } from 'react';
import { API_URL } from '../../config';

type Mode = 'general' | 'shipping' | 'whatsapp';

export function AdminSettings({ token, mode }: { token: string; mode: Mode }) {
  const [store, setStore] = useState<Record<string, unknown>>({});
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [theme, setTheme] = useState('#111111');
  const [delivery, setDelivery] = useState(200);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(false);

  useEffect(() => {
    async function load() {
      const resp = await fetch(`${API_URL}/stores/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return;
      setStore(data);
      setName(String(data?.name ?? ''));
      setWhatsapp(String(data?.whatsappNumber ?? ''));
      const deliverySettings = (data?.deliverySettings && typeof data.deliverySettings === 'object') ? (data.deliverySettings as Record<string, unknown>) : {};
      const paymentMethods = (data?.paymentMethods && typeof data.paymentMethods === 'object') ? (data.paymentMethods as Record<string, unknown>) : {};
      setDelivery(Number(deliverySettings.standard ?? 200));
      setCodEnabled(Boolean(paymentMethods.cod ?? true));
      setOnlineEnabled(Boolean(paymentMethods.online ?? false));
    }
    load();
  }, [token]);

  async function saveGeneral() {
    await fetch(`${API_URL}/stores/my`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, whatsappNumber: whatsapp }),
    });
    await fetch(`${API_URL}/stores/my/theme`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ themeColors: { primary: theme } }),
    });
  }

  async function saveShipping() {
    await fetch(`${API_URL}/stores/my/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ delivery_settings: { standard: delivery } }),
    });
  }

  async function saveWhatsapp() {
    await fetch(`${API_URL}/stores/my/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payment_methods: { cod: codEnabled, online: onlineEnabled } }),
    });
    await fetch(`${API_URL}/stores/my`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ whatsappNumber: whatsapp }),
    });
  }

  return (
    <div className="bg-[#111118] border border-gray-800 rounded-2xl p-5 space-y-4">
      {mode === 'general' && (
        <>
          <h3 className="font-bold">Store Settings</h3>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Store name" className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <div>
            <label className="text-xs text-gray-500">Theme color</label>
            <input type="color" value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full h-10 bg-transparent" />
          </div>
          <button onClick={saveGeneral} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save</button>
        </>
      )}

      {mode === 'shipping' && (
        <>
          <h3 className="font-bold">Shipping Settings</h3>
          <input type="number" value={delivery} onChange={(e) => setDelivery(Number(e.target.value))} placeholder="Standard delivery fee" className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <button onClick={saveShipping} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save Shipping</button>
        </>
      )}

      {mode === 'whatsapp' && (
        <>
          <h3 className="font-bold">WhatsApp & Payment</h3>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} /> COD Enabled</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlineEnabled} onChange={(e) => setOnlineEnabled(e.target.checked)} /> Online Payment Enabled</label>
          <button onClick={saveWhatsapp} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save</button>
        </>
      )}
    </div>
  );
}
