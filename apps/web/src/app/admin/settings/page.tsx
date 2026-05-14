"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Bell,
  Shield,
  CreditCard,
  Users,
  Store,
  Zap,
  Save,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";

const TABS = [
  { key: "platform", label: "Platform", icon: Globe },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "payments", label: "Payments", icon: CreditCard },
];

type PlatformSettings = {
  platformName: string;
  platformEmail: string;
  platformPhone: string;
  maintenanceMode: boolean;
  allowNewStores: boolean;
  defaultCurrency: string;
  platformFeePercent: number;
};

type NotificationSettings = {
  newStoreApproval: boolean;
  newUserSignup: boolean;
  largeOrder: boolean;
  systemAlerts: boolean;
  weeklyReport: boolean;
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("platform");
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Platform Settings
  const [platformName, setPlatformName] = useState("Storezen");
  const [platformEmail, setPlatformEmail] = useState("admin@storezen.pk");
  const [platformPhone, setPlatformPhone] = useState("03001234567");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowNewStores, setAllowNewStores] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("PKR");
  const [platformFee, setPlatformFee] = useState(10);

  // Notification Settings
  const [notifNewStore, setNotifNewStore] = useState(true);
  const [notifNewUser, setNotifNewUser] = useState(true);
  const [notifLargeOrder, setNotifLargeOrder] = useState(true);
  const [notifSystemAlerts, setNotifSystemAlerts] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);

  useEffect(() => {
    // Load platform settings from API
    authFetch("/admin/settings")
      .then((data) => {
        const settings = data as PlatformSettings;
        if (settings.platformName) setPlatformName(settings.platformName);
        if (settings.platformEmail) setPlatformEmail(settings.platformEmail);
        if (settings.maintenanceMode !== undefined) setMaintenanceMode(settings.maintenanceMode);
        if (settings.allowNewStores !== undefined) setAllowNewStores(settings.allowNewStores);
        if (settings.platformFeePercent) setPlatformFee(settings.platformFeePercent);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await authFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          platformName,
          platformEmail,
          platformPhone,
          maintenanceMode,
          allowNewStores,
          defaultCurrency,
          platformFeePercent: platformFee,
        }),
      });
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-zinc-200",
        )}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Settings</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Platform-wide configuration and preferences</p>
        </div>
        <Button
          size="md"
          onClick={handleSave}
          disabled={saving}
          className="h-11 gap-2 rounded-xl font-bold shadow-lg shadow-zinc-900/10"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
              Saving...
            </span>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2.5} />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Maintenance Mode Banner */}
      {maintenanceMode && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Maintenance Mode Active</p>
            <p className="text-xs text-amber-700">Customers and merchants cannot access the platform</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setMaintenanceMode(false)}>
            Disable
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[200px,1fr]">
        {/* Sidebar tabs */}
        <div className="space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* Platform Tab */}
          {activeTab === "platform" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-zinc-900">Platform Information</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Basic platform details shown across the site</p>
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform Name</label>
                    <Input className="mt-1.5 h-11 rounded-xl" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Support Email</label>
                    <Input className="mt-1.5 h-11 rounded-xl" type="email" value={platformEmail} onChange={(e) => setPlatformEmail(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Support Phone</label>
                    <Input className="mt-1.5 h-11 rounded-xl" value={platformPhone} onChange={(e) => setPlatformPhone(e.target.value)} inputMode="tel" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Default Currency</label>
                    <select
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                    >
                      <option value="PKR">PKR - Pakistani Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "platform" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-zinc-900">Platform Configuration</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Control platform-wide features and behavior</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-zinc-50">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Maintenance Mode</p>
                    <p className="text-xs text-zinc-500">Disable platform access for all users</p>
                  </div>
                  <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-zinc-50">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Allow New Stores</p>
                    <p className="text-xs text-zinc-500">Enable new merchant registrations</p>
                  </div>
                  <Toggle checked={allowNewStores} onChange={setAllowNewStores} />
                </div>
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Platform Fee (%)</p>
                      <p className="text-xs text-zinc-500">Commission on each transaction</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{platformFee}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>0%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-zinc-900">Notification Preferences</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Control what notifications you receive</p>
              <div className="mt-5 space-y-0">
                {[
                  { label: "New Store Approval", desc: "When a new store requests approval", checked: notifNewStore, onChange: setNotifNewStore, icon: Store },
                  { label: "New User Signup", desc: "When a new user registers on the platform", checked: notifNewUser, onChange: setNotifNewUser, icon: Users },
                  { label: "Large Orders", desc: "Orders above PKR 50,000", checked: notifLargeOrder, onChange: setNotifLargeOrder, icon: TrendingUp },
                  { label: "System Alerts", desc: "Critical platform issues and warnings", checked: notifSystemAlerts, onChange: setNotifSystemAlerts, icon: AlertTriangle },
                  { label: "Weekly Report", desc: "Summary of platform performance", checked: notifWeeklyReport, onChange: setNotifWeeklyReport, icon: Package },
                ].map(({ label, desc, checked, onChange, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{label}</p>
                        <p className="text-xs text-zinc-500">{desc}</p>
                      </div>
                    </div>
                    <Toggle checked={checked} onChange={onChange} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-zinc-900">Security Settings</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Platform security and access controls</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-zinc-50">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Two-Factor Authentication</p>
                    <p className="text-xs text-zinc-500">Require 2FA for admin accounts</p>
                  </div>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-zinc-50">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Session Timeout</p>
                    <p className="text-xs text-zinc-500">Auto logout after inactivity</p>
                  </div>
                  <select className="h-9 rounded-lg border border-zinc-200 px-3 text-sm">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                  </select>
                </div>
                <div className="py-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Admin IP Whitelist</label>
                  <textarea
                    className="mt-1.5 min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="Enter IP addresses (one per line)"
                  />
                  <p className="mt-1 text-[10px] text-zinc-400">Leave empty to allow all IPs</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-zinc-900">Payment Configuration</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Configure payment gateways for the platform</p>
              <div className="mt-5 space-y-4">
                {[
                  { name: "Cash on Delivery", enabled: true, desc: "Allow COD payments" },
                  { name: "Bank Transfer", enabled: true, desc: "Direct bank transfers" },
                  { name: "JazzCash", enabled: false, desc: "Mobile wallet integration" },
                  { name: "EasyPaisa", enabled: false, desc: "Mobile wallet integration" },
                  { name: "Stripe", enabled: false, desc: "International card payments" },
                ].map((gateway) => (
                  <div key={gateway.name} className="flex items-center justify-between py-3 border-b border-zinc-50">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{gateway.name}</p>
                      <p className="text-xs text-zinc-500">{gateway.desc}</p>
                    </div>
                    <Toggle checked={gateway.enabled} onChange={() => {}} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100">
                <Button variant="secondary">Configure Gateway Keys</Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}