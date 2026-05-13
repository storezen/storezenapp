"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  DollarSign,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  MessageCircle,
  Star,
  TrendingUp,
  FileText,
  RefreshCw,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { LoadingSpinner } from "@/components/ui/notifications/loading-states";
import type { Order } from "@/types";

type CustomerStats = {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  pendingOrders: number;
  deliveredOrders: number;
};

type CustomerNote = {
  id: string;
  content: string;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  new: { label: "New", color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50", icon: Package },
  processing: { label: "Processing", color: "text-blue-700", bg: "bg-blue-50", icon: Package },
  shipped: { label: "Shipped", color: "text-violet-700", bg: "bg-violet-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-700", bg: "bg-red-50", icon: XCircle },
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const toast = useToast();

  const [customer, setCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
  } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  // Decode customer info from ID (in real app would fetch from API)
  useEffect(() => {
    if (!customerId) return;

    // Fetch orders for this customer
    Promise.all([
      authFetch("/orders"),
    ])
      .then(([ordersRes]) => {
        const ordersData = ordersRes as { orders?: Order[] };
        const customerOrders = (ordersData.orders ?? []).filter(
          (o) => o.customer_phone || o.customer_name
        );

        // For demo, we'll create customer from first order
        if (customerOrders.length > 0) {
          const firstOrder = customerOrders[0];
          setCustomer({
            id: customerId,
            name: firstOrder.customer_name || "Customer",
            email: "",
            phone: firstOrder.customer_phone || "",
            city: firstOrder.customer_city || "",
            address: firstOrder.customer_address || "",
          });
        }

        setOrders(customerOrders);

        // Calculate stats
        const totalOrders = customerOrders.length;
        const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const deliveredOrders = customerOrders.filter((o) => o.order_status === "delivered").length;
        const pendingOrders = customerOrders.filter((o) => ["pending", "confirmed", "processing", "shipped"].includes(o.order_status)).length;

        setStats({
          totalOrders,
          totalSpent,
          avgOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
          firstOrderDate: customerOrders[customerOrders.length - 1]?.created_at || "",
          lastOrderDate: customerOrders[0]?.created_at || "",
          pendingOrders,
          deliveredOrders,
        });
      })
      .catch(() => {
        // Mock data for demo
        setCustomer({
          id: customerId,
          name: "Customer",
          phone: "",
          city: "",
          address: "",
          email: "",
        });
        setOrders([]);
        setStats(null);
        toast.error("Failed to load customer");
      })
      .finally(() => setLoading(false));
  }, [customerId, toast]);

  async function addNote() {
    if (!newNote.trim()) return;

    const note: CustomerNote = {
      id: Date.now().toString(),
      content: newNote,
      createdAt: new Date().toISOString(),
    };

    setNotes([note, ...notes]);
    setNewNote("");
    setShowAddNote(false);
  }

  // Determine customer tier
  const getCustomerTier = () => {
    if (!stats) return { label: "New", color: "bg-zinc-100 text-zinc-600", icon: Users };
    if (stats.totalSpent >= 100000) return { label: "VIP", color: "bg-amber-100 text-amber-700", icon: Star };
    if (stats.totalOrders >= 5) return { label: "Regular", color: "bg-emerald-100 text-emerald-700", icon: TrendingUp };
    return { label: "New", color: "bg-zinc-100 text-zinc-600", icon: Users };
  };

  const tier = getCustomerTier();
  const TierIcon = tier.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/account/customers" className="p-2 hover:bg-zinc-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold text-lg">
              {customer?.name?.charAt(0) || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900">{customer?.name || "Customer"}</h1>
                <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", tier.color)}>
                  <TierIcon className="h-3 w-3" />
                  {tier.label}
                </span>
              </div>
              <p className="text-sm text-zinc-500">Customer since {stats?.firstOrderDate ? new Date(stats.firstOrderDate).toLocaleDateString("en-PK", { month: "short", year: "numeric" }) : "N/A"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalOrders}</p>
                <p className="text-xs text-zinc-500">Total Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-xs text-zinc-500">Total Spent</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats.avgOrderValue)}</p>
                <p className="text-xs text-zinc-500">Avg. Order Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900">{stats.pendingOrders}</p>
                <p className="text-xs text-zinc-500">Pending Orders</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info & Notes */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Information
            </h2>
            <div className="space-y-4">
              {customer?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <a href={`tel:${customer.phone}`} className="text-sm text-zinc-600 hover:text-emerald-600">
                    {customer.phone}
                  </a>
                </div>
              )}
              {customer?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <a href={`mailto:${customer.email}`} className="text-sm text-zinc-600 hover:text-emerald-600">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer?.city && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-zinc-600">{customer.city}</p>
                    {customer.address && <p className="text-xs text-zinc-400">{customer.address}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Timeline */}
          {stats && (
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">First Order</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {stats.firstOrderDate ? new Date(stats.firstOrderDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Last Order</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Delivered Orders</span>
                  <span className="text-sm font-medium text-emerald-600">{stats.deliveredOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Cancellation Rate</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {stats.totalOrders > 0 ? Math.round((orders.filter(o => o.order_status === "cancelled").length / stats.totalOrders) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </h2>
              <Button size="sm" variant="outline" onClick={() => setShowAddNote(!showAddNote)}>
                <Edit className="h-3 w-3 mr-1" />
                Add Note
              </Button>
            </div>

            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-zinc-50 rounded-lg">
                    <p className="text-sm text-zinc-700">{note.content}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {new Date(note.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No notes added yet</p>
            )}

            {showAddNote && (
              <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
                <Textarea
                  placeholder="Add a note about this customer..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addNote}>Save Note</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddNote(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order History ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-10 w-10 text-zinc-300" />
                <p className="text-sm text-zinc-500 mt-2">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusConfig[order.order_status ?? "pending"] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-zinc-900">#{order.id?.slice(-6)}</span>
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.bg, status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                        <span className="text-sm text-zinc-500">
                          {new Date(order.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <span>{order.items?.length} items</span>
                          <span>•</span>
                          <span>{order.customer_city}</span>
                        </div>
                        <span className="font-bold text-zinc-900">{formatCurrency(order.total)}</span>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2 overflow-x-auto">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 w-10 h-10 bg-zinc-100 rounded overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-zinc-300" />
                              </div>
                            )}
                          </div>
                        ))}
                        {(order.items?.length ?? 0) > 3 && (
                          <div className="flex-shrink-0 w-10 h-10 bg-zinc-100 rounded flex items-center justify-center">
                            <span className="text-xs text-zinc-500">+{order.items!.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}