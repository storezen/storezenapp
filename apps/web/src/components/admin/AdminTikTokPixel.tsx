import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Save, Eye, EyeOff, Trash2, AlertCircle, Check, Activity, Info, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../hooks/use-toast';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface PixelEvent {
  event: string;
  params?: Record<string, unknown>;
  ts: number;
}

interface PixelSettings {
  pixelId: string;
  enabled: boolean;
  trackPageView: boolean;
  trackAddToCart: boolean;
  trackInitiateCheckout: boolean;
  trackCompletePayment: boolean;
  trackViewContent: boolean;
  trackSearch: boolean;
}

const STORAGE_KEY = 'zorvik_tiktok_pixel_settings';
const LOG_KEY = 'zorvik_tiktok_pixel_debug_log';
const MAX_LOGS = 100;

const EVENT_LABELS: Record<string, string> = {
  PageView: 'Page View',
  ViewContent: 'View Content (Product)',
  AddToCart: 'Add to Cart',
  InitiateCheckout: 'Initiate Checkout',
  CompletePayment: 'Complete Payment',
  Search: 'Search',
};

const GRAD = 'bg-gradient-to-r from-rose-500 to-purple-600';

/* ── Settings storage ───────────────────────────────────────────────────── */
function loadSettings(): PixelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {}
  return defaultSettings();
}

function defaultSettings(): PixelSettings {
  return {
    pixelId: '',
    enabled: true,
    trackPageView: true,
    trackAddToCart: true,
    trackInitiateCheckout: true,
    trackCompletePayment: true,
    trackViewContent: true,
    trackSearch: false,
  };
}

function saveSettings(s: PixelSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function loadLog(): PixelEvent[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function clearLog() {
  localStorage.removeItem(LOG_KEY);
}

/* ── Toggle row ─────────────────────────────────────────────────────────── */
function ToggleRow({ label, value, onChange, sub }: { label: string; value: boolean; onChange: (v: boolean) => void; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-gray-200 text-sm font-medium">{label}</p>
        {sub && <p className="text-gray-600 text-xs">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5.5 rounded-full transition-colors ${value ? 'bg-rose-500' : 'bg-gray-700'} flex items-center px-0.5 flex-shrink-0`}
        style={{ height: '22px', width: '40px' }}
      >
        <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-[18px]' : ''}`} />
      </button>
    </div>
  );
}

/* ── Event Badge ─────────────────────────────────────────────────────────── */
function EventBadge({ event }: { event: string }) {
  const colors: Record<string, string> = {
    PageView: 'bg-gray-800 text-gray-300',
    ViewContent: 'bg-blue-900/40 text-blue-300',
    AddToCart: 'bg-emerald-900/40 text-emerald-300',
    InitiateCheckout: 'bg-amber-900/40 text-amber-300',
    CompletePayment: 'bg-purple-900/40 text-purple-300',
    Search: 'bg-pink-900/40 text-pink-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[event] ?? 'bg-gray-800 text-gray-400'}`}>
      {event}
    </span>
  );
}

/* ── Debug Panel ─────────────────────────────────────────────────────────── */
function DebugPanel() {
  const [log, setLog] = useState<PixelEvent[]>(loadLog);
  const [open, setOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setLog(loadLog()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  function handleClear() { clearLog(); setLog([]); }

  return (
    <div className="bg-[#0a0a12] border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-rose-400" />
          <span className="text-white font-bold text-sm">Event Debug Log</span>
          {log.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{log.length}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
      </button>

      {open && (
        <div className="border-t border-gray-800">
          <div className="flex items-center justify-between px-5 py-2">
            <p className="text-gray-600 text-xs">Events fired during this session (refreshes every 2s)</p>
            {log.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto px-5 pb-4 space-y-2">
            {log.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={24} className="text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No events yet</p>
                <p className="text-gray-700 text-xs mt-1">Browse the store to see events appear here</p>
              </div>
            ) : (
              log.slice().reverse().map((e, i) => (
                <div key={i} className="bg-[#111118] border border-gray-800/60 rounded-xl p-3 font-mono">
                  <div className="flex items-center justify-between mb-2">
                    <EventBadge event={e.event} />
                    <span className="text-gray-600 text-[10px]">{new Date(e.ts).toLocaleTimeString()}</span>
                  </div>
                  {e.params && Object.keys(e.params).length > 0 && (
                    <pre className="text-gray-500 text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(e.params, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export function AdminTikTokPixel({ token }: { token: string }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PixelSettings>(() => {
    const base = loadSettings();
    return base;
  });
  const [saved, setSaved] = useState(false);
  const [showId, setShowId] = useState(false);
  const [loadingStore, setLoadingStore] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStorePixel = useCallback(async () => {
    setLoadingStore(true);
    try {
      const resp = await fetch(`${API_URL}/stores/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await resp.json().catch(() => ({}))) as { tiktokPixel?: string | null };
      if (resp.ok && typeof data?.tiktokPixel === 'string' && data.tiktokPixel.trim()) {
        setSettings((s) => ({ ...s, pixelId: data.tiktokPixel.trim() }));
      }
    } catch {
      /* keep local */
    } finally {
      setLoadingStore(false);
    }
  }, [token]);

  useEffect(() => {
    loadStorePixel();
  }, [loadStorePixel]);

  function update(patch: Partial<PixelSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const resp = await fetch(`${API_URL}/stores/my/pixel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tiktokPixel: settings.pixelId.trim() || undefined }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast({
          title: 'Save failed',
          description: String(data?.error ?? 'Could not save pixel'),
          variant: 'destructive',
        });
        return;
      }
      saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (settings.pixelId && window.ttq) {
        try {
          window.ttq.load(settings.pixelId);
        } catch {
          /* ignore */
        }
      }
      toast({ title: 'Pixel saved', description: 'TikTok Pixel ID stored on your store.' });
    } finally {
      setSaving(false);
    }
  }

  const isValidPixelId = settings.pixelId.length > 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-white font-black text-xl flex items-center gap-2">
            <TrendingUp size={20} className="text-rose-400" /> TikTok Pixel
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Pixel ID is loaded from your store and saved with &quot;Save&quot; (PUT /stores/my/pixel). Event toggles stay on this device.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadingStore && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Loading…
            </span>
          )}
          <button
            type="button"
            onClick={() => loadStorePixel()}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700"
          >
            Reload from API
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50
            ${saved ? 'bg-emerald-600 text-white' : `${GRAD} text-white`}`}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving…
              </>
            ) : saved ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              <>
                <Save size={14} /> Save to API
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pixel ID */}
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} className="text-rose-400" /> Pixel Configuration
        </h3>

        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Pixel ID</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showId ? 'text' : 'password'}
                value={settings.pixelId}
                onChange={e => update({ pixelId: e.target.value })}
                placeholder="C1A2B3D4E5F6G7H8"
                className={`w-full bg-[#0d0d1a] border rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none transition-colors pr-10
                  ${isValidPixelId ? 'border-emerald-800/60 focus:border-emerald-500/60' : 'border-gray-800 focus:border-rose-500/60'}`}
              />
              <button
                type="button"
                onClick={() => setShowId(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showId ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2 flex items-start gap-1.5">
            <Info size={11} className="mt-0.5 flex-shrink-0" />
            Find your Pixel ID in TikTok Ads Manager → Events → Web Events → Setup Web Events
          </p>
        </div>

        {!isValidPixelId && settings.pixelId.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800/30 rounded-xl p-3">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            <p className="text-amber-300 text-xs">Pixel ID seems too short. Typical IDs are 16 chars long.</p>
          </div>
        )}

        <ToggleRow
          label="Enable Pixel Tracking"
          value={settings.enabled}
          onChange={v => update({ enabled: v })}
          sub="Master switch — disable to pause all events without removing the pixel"
        />
      </div>

      {/* Event Toggles */}
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 mb-1">
          <Activity size={14} className="text-rose-400" /> Event Toggles
        </h3>
        <p className="text-gray-600 text-xs mb-4">Choose which events to track. Changes take effect after save.</p>

        <div>
          <ToggleRow label="Page View" value={settings.trackPageView} onChange={v => update({ trackPageView: v })} sub="Fired on every page navigation" />
          <ToggleRow label="View Content" value={settings.trackViewContent} onChange={v => update({ trackViewContent: v })} sub="Product detail page views" />
          <ToggleRow label="Add to Cart" value={settings.trackAddToCart} onChange={v => update({ trackAddToCart: v })} sub="When a product is added to cart" />
          <ToggleRow label="Initiate Checkout" value={settings.trackInitiateCheckout} onChange={v => update({ trackInitiateCheckout: v })} sub="When checkout/order form is opened" />
          <ToggleRow label="Complete Payment" value={settings.trackCompletePayment} onChange={v => update({ trackCompletePayment: v })} sub="After successful order placement (highest value)" />
          <ToggleRow label="Search" value={settings.trackSearch} onChange={v => update({ trackSearch: v })} sub="When user searches products" />
        </div>
      </div>

      {/* Status */}
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Current Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(EVENT_LABELS).map(([key, label]) => {
            const toggleKey = `track${key}` as keyof PixelSettings;
            const active = settings.enabled && (toggleKey in settings ? Boolean(settings[toggleKey]) : true);
            return (
              <div key={key} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${
                active ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-gray-900/40 border-gray-800/40'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                <span className={`text-xs font-medium ${active ? 'text-emerald-300' : 'text-gray-600'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
}
