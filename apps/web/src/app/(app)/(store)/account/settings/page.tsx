"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Store,
  Truck,
  Bell,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Camera,
  AlertTriangle,
  Target,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";

type TabId = "profile" | "password" | "store" | "delivery" | "notifications" | "pixels" | "danger";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, updateProfile, changePassword } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  // Store settings state
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [codEnabled, setCodEnabled] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMsg, setStoreMsg] = useState("");

  // Delivery state
  const [freeShippingMin, setFreeShippingMin] = useState(1500);
  const [deliveryFee, setDeliveryFee] = useState(199);
  const [deliveryTime, setDeliveryTime] = useState("3-5 days");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryMsg, setDeliveryMsg] = useState("");

  // Notifications state
  const [notifOrder, setNotifOrder] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [notifStock, setNotifStock] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");

  // Pixels state
  const [metaPixelId, setMetaPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [pixelSaving, setPixelSaving] = useState(false);
  const [pixelMsg, setPixelMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  // Fetch store settings
  useEffect(() => {
    if (!user?.storeId) return;

    authFetch(`/stores/my`)
      .then((data: unknown) => {
        const store = data as Record<string, unknown>;
        setStoreName(String(store.name ?? ""));
        setStoreSlug(String(store.slug ?? ""));
        setWhatsapp(String(store.whatsapp_number ?? ""));
        setStoreEmail(String(store.email ?? ""));
        const pm = (store.paymentMethods as { cod?: boolean } | null) || {};
        setCodEnabled(pm.cod ?? true);
        const ds = (store.deliverySettings as { freeShippingMin?: number; deliveryFee?: number; deliveryTime?: string } | null) || {};
        setFreeShippingMin(ds.freeShippingMin ?? 1500);
        setDeliveryFee(ds.deliveryFee ?? 199);
        setDeliveryTime(ds.deliveryTime ?? "3-5 days");
        setMetaPixelId(String(store.metaPixel ?? ""));
        setTiktokPixelId(String(store.tiktokPixel ?? ""));
      })
      .catch(() => {});
  }, [user?.storeId]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await updateProfile({ name, email });
      setProfileMsg("Profile updated successfully!");
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg("");
    if (newPassword !== confirmPassword) return setPasswordMsg("New passwords don't match");
    if (newPassword.length < 8) return setPasswordMsg("Password must be at least 8 characters");
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMsg("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : "Failed to change");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleStoreSave() {
    setStoreSaving(true);
    setStoreMsg("");
    try {
      await authFetch(`/stores/my`, {
        method: "PATCH",
        body: JSON.stringify({
          name: storeName,
          slug: storeSlug,
          description: storeDesc,
          email: storeEmail,
          whatsappNumber: whatsapp,
          address: storeAddress,
          paymentMethods: { cod: codEnabled },
        }),
      });
      setStoreMsg("Store settings saved!");
    } catch {
      setStoreMsg("Failed to save settings");
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleDeliverySave() {
    setDeliverySaving(true);
    setDeliveryMsg("");
    try {
      await authFetch(`/stores/my`, {
        method: "PATCH",
        body: JSON.stringify({
          deliverySettings: {
            freeShippingMin,
            deliveryFee,
            deliveryTime,
          },
        }),
      });
      setDeliveryMsg("Delivery settings saved!");
    } catch {
      setDeliveryMsg("Failed to save");
    } finally {
      setDeliverySaving(false);
    }
  }

  async function handlePixelSave() {
    setPixelSaving(true);
    setPixelMsg("");
    try {
      await authFetch(`/stores/my/pixel`, {
        method: "PUT",
        body: JSON.stringify({
          metaPixel: metaPixelId.trim() || null,
          tiktokPixel: tiktokPixelId.trim() || null,
        }),
      });
      setPixelMsg("Pixel settings saved!");
    } catch {
      setPixelMsg("Failed to save pixel settings");
    } finally {
      setPixelSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "store", label: "Store", icon: Store },
    { id: "delivery", label: "Delivery", icon: Truck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "pixels", label: "Pixels", icon: Target },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-96 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your account and store</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 sticky top-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium w-full transition-colors",
                    activeTab === tab.id
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-4 space-y-6">

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Profile Information</h2>
                <p className="text-sm text-zinc-500">Update your personal details</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-600">
                  {name.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Profile Photo</p>
                  <p className="text-sm text-zinc-500">Your initials are shown automatically</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Email Address</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                  </div>
                </div>
                {profileMsg && (
                  <p className={cn("text-sm", profileMsg.includes("success") ? "text-emerald-600" : "text-red-600")}>
                    {profileMsg}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={profileSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Change Password</h2>
                <p className="text-sm text-zinc-500">Ensure your account stays secure</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Current Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">New Password</label>
                  <div className="relative mt-1">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full", newPassword.length >= i * 2 ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-amber-500" : "bg-emerald-500" : "bg-zinc-200")} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Confirm New Password</label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" placeholder="Confirm password" />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                {passwordMsg && (
                  <p className={cn("text-sm", passwordMsg.includes("success") ? "text-emerald-600" : "text-red-600")}>
                    {passwordMsg}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordSaving} className="gap-2">
                    <Lock className="h-4 w-4" />
                    {passwordSaving ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Store */}
          {activeTab === "store" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Store Information</h2>
                  <p className="text-sm text-zinc-500">Basic store details</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Store Name</label>
                    <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="mt-1" placeholder="My Store" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Store URL</label>
                    <div className="flex mt-1">
                      <span className="px-3 py-2 bg-zinc-100 border border-r-0 border-zinc-300 rounded-l-lg text-sm text-zinc-500">vendrix.pk/</span>
                      <Input value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} className="rounded-l-none" placeholder="my-store" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Description</label>
                  <Textarea value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} className="mt-1" rows={2} placeholder="Describe your store..." />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Contact</h2>
                  <p className="text-sm text-zinc-500">How customers can reach you</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-zinc-700">WhatsApp</label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1" placeholder="923001234567" />
                    <p className="text-xs text-zinc-400 mt-1">Orders will be sent here</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700">Email</label>
                    <Input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="mt-1" placeholder="store@email.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Address</label>
                  <Textarea value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="mt-1" rows={2} placeholder="Business address..." />
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Payments</h2>
                  <p className="text-sm text-zinc-500">Payment methods you accept</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200">
                  <div>
                    <p className="font-medium text-zinc-900">Cash on Delivery</p>
                    <p className="text-sm text-zinc-500">Accept cash when your order arrives</p>
                  </div>
                  <button
                    onClick={() => setCodEnabled(!codEnabled)}
                    className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", codEnabled ? "bg-emerald-500" : "bg-zinc-300")}
                  >
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", codEnabled ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
                {storeMsg && (
                  <p className={cn("text-sm", storeMsg.includes("saved") ? "text-emerald-600" : "text-red-600")}>
                    {storeMsg}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleStoreSave} disabled={storeSaving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {storeSaving ? "Saving..." : "Save Store Settings"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delivery */}
          {activeTab === "delivery" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Delivery Settings</h2>
                <p className="text-sm text-zinc-500">Configure shipping options</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Free Shipping (Min PKR)</label>
                  <Input type="number" value={freeShippingMin} onChange={(e) => setFreeShippingMin(parseInt(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Delivery Fee (PKR)</label>
                  <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(parseInt(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Delivery Time</label>
                  <Input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-1" placeholder="3-5 days" />
                </div>
              </div>
              {deliveryMsg && (
                <p className={cn("text-sm", deliveryMsg.includes("saved") ? "text-emerald-600" : "text-red-600")}>
                  {deliveryMsg}
                </p>
              )}
              <div className="flex justify-end">
                <Button onClick={handleDeliverySave} disabled={deliverySaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {deliverySaving ? "Saving..." : "Save Delivery Settings"}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Notifications</h2>
                <p className="text-sm text-zinc-500">Control what updates you receive</p>
              </div>
              {[
                { label: "Order Notifications", desc: "When you receive new orders", checked: notifOrder, onChange: setNotifOrder },
                { label: "WhatsApp Updates", desc: "Send order details via WhatsApp", checked: notifWhatsapp, onChange: setNotifWhatsapp },
                { label: "Low Stock Alerts", desc: "When products are running low", checked: notifStock, onChange: setNotifStock },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-zinc-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => item.onChange(!item.checked)}
                    className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", item.checked ? "bg-emerald-500" : "bg-zinc-300")}
                  >
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", item.checked ? "translate-x-6" : "translate-x-1")} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pixels */}
          {activeTab === "pixels" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Meta Pixel (Facebook)</h2>
                  <p className="text-sm text-zinc-500">Track conversions and optimize ads</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Meta Pixel ID</label>
                  <Input
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    className="mt-1"
                    placeholder="e.g., 1234567890"
                  />
                  <p className="text-xs text-zinc-400 mt-1">Find it in Facebook Events Manager → Data Sources → Your Pixel</p>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">TikTok Pixel</h2>
                  <p className="text-sm text-zinc-500">Track TikTok ad conversions</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">TikTok Pixel ID</label>
                  <Input
                    value={tiktokPixelId}
                    onChange={(e) => setTiktokPixelId(e.target.value)}
                    className="mt-1"
                    placeholder="e.g., C2O4C3"
                  />
                  <p className="text-xs text-zinc-400 mt-1">Find it in TikTok Events Manager → Pixels</p>
                </div>
              </div>

              {pixelMsg && (
                <p className={cn("text-sm", pixelMsg.includes("saved") ? "text-emerald-600" : "text-red-600")}>
                  {pixelMsg}
                </p>
              )}
              <div className="flex justify-end">
                <Button onClick={handlePixelSave} disabled={pixelSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {pixelSaving ? "Saving..." : "Save Pixel Settings"}
                </Button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === "danger" && (
            <div className="rounded-xl border border-red-200/60 bg-red-50/30 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
                  <p className="text-sm text-red-600">Irreversible actions — please be careful</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                  <div>
                    <p className="font-medium text-zinc-900">Delete Account</p>
                    <p className="text-sm text-zinc-500">Permanently remove your account and all data</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      toast.warning("Please contact support to delete your account");
                    }}
                  >
                    Delete Account
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4">
                  <div>
                    <p className="font-medium text-zinc-900">Clear All Data</p>
                    <p className="text-sm text-zinc-500">Remove all products, orders, and customer data</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      toast.warning("Please contact support to clear your data");
                    }}
                  >
                    Clear Data
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
