import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { BarChart3, FolderOpen, LogOut, MessageCircle, Package, Settings, ShoppingBag, Truck, Ticket, TrendingUp, Users } from 'lucide-react';
import { API_URL } from '../config';
import { useAuth } from '../hooks/use-auth';
import { AdminProductsApi } from '../components/admin/AdminProductsApi';
import { AdminCollectionsApi } from '../components/admin/AdminCollectionsApi';
import { AdminTemplates } from '../components/admin/AdminTemplates';
import { AdminTikTokPixel } from '../components/admin/AdminTikTokPixel';
import { AdminOrders } from '../components/admin/AdminOrders';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminCoupons } from '../components/admin/AdminCoupons';
import { AdminInfluencers } from '../components/admin/AdminInfluencers';

type StatsResponse = {
  stats?: {
    totalOrders?: number;
    totalRevenue?: number;
    pendingOrders?: number;
  };
};

type TabId = 'orders' | 'products' | 'collections' | 'coupons' | 'influencers' | 'settings' | 'shipping' | 'whatsapp' | 'tiktok';

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className="text-white text-2xl font-black mt-1">{value}</p>
    </div>
  );
}

export default function Admin() {
  const { isLoading, isAuthenticated, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [stats, setStats] = useState<StatsResponse['stats']>();

  useEffect(() => {
    async function loadStats() {
      if (!token) return;
      try {
        const resp = await fetch(`${API_URL}/stores/my/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await resp.json().catch(() => ({}))) as StatsResponse;
        if (resp.ok) setStats(data.stats);
      } catch {
        setStats(undefined);
      }
    }
    loadStats();
  }, [token]);

  const tabs = useMemo(
    () =>
      [
        { id: 'orders', label: 'Orders', icon: <ShoppingBag size={12} /> },
        { id: 'products', label: 'Products', icon: <Package size={12} /> },
        { id: 'collections', label: 'Collections', icon: <FolderOpen size={12} /> },
        { id: 'coupons', label: 'Coupons', icon: <Ticket size={12} /> },
        { id: 'influencers', label: 'Influencers', icon: <Users size={12} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={12} /> },
        { id: 'shipping', label: 'Shipping', icon: <Truck size={12} /> },
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={12} /> },
        { id: 'tiktok', label: 'TikTok Pixel', icon: <TrendingUp size={12} /> },
      ] as const,
    [],
  );

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-black">Admin Login Required</h1>
          <p className="text-gray-400 text-sm">Please login with your account to access dashboard.</p>
          <button
            onClick={() => setLocation('/login')}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-2.5 rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="bg-[#111118] border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <h1 className="font-black text-sm">Store Admin</h1>
        <button
          onClick={() => {
            logout();
            setLocation('/login');
          }}
          className="flex items-center gap-1.5 text-xs bg-rose-900/40 hover:bg-rose-800/50 text-rose-300 px-3 py-2 rounded-lg"
        >
          <LogOut size={13} /> Logout
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard label="Total Orders" value={String(stats?.totalOrders ?? 0)} />
          <StatsCard label="Revenue" value={`Rs. ${Number(stats?.totalRevenue ?? 0).toLocaleString()}`} />
          <StatsCard label="Pending" value={String(stats?.pendingOrders ?? 0)} />
          <StatsCard label="Health" value="Live" />
        </div>

        <div className="overflow-x-auto">
          <div className="flex items-center bg-[#0d0d1a] rounded-xl border border-gray-800 p-1 gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                  activeTab === tab.id ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'orders' && <AdminOrders token={token} />}
        {activeTab === 'products' && <AdminProductsApi token={token} />}
        {activeTab === 'collections' && <AdminCollectionsApi token={token} />}
        {activeTab === 'coupons' && <AdminCoupons token={token} />}
        {activeTab === 'influencers' && <AdminInfluencers token={token} />}
        {activeTab === 'settings' && <AdminSettings token={token} mode="general" />}
        {activeTab === 'shipping' && <AdminSettings token={token} mode="shipping" />}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <AdminSettings token={token} mode="whatsapp" />
            <AdminTemplates />
          </div>
        )}
        {activeTab === 'tiktok' && <AdminTikTokPixel />}
      </main>
    </div>
  );
}
