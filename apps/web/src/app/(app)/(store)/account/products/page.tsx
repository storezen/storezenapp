"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/notifications/toast-system";
import { useConfirmModal } from "@/components/ui/notifications/modal-system";
import { SkeletonList } from "@/components/ui/notifications/loading-states";
import type { Product } from "@/types";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const toast = useToast();
  const { deleteProduct } = useConfirmModal();

  useEffect(() => {
    authFetch("/products")
      .then((data: unknown) => {
        const response = data as { products?: Product[] };
        setProducts(response.products ?? []);
      })
      .catch(() => {
        // Handle error silently - show empty state
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(() => {
      authFetch(`/products/${productId}`, { method: "DELETE" })
        .then(() => {
          setProducts(prev => prev.filter(p => p.id !== productId));
          toast.success("Product deleted successfully");
        })
        .catch(() => toast.error("Failed to delete product"));
    });
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">{products.length} total products</p>
        </div>
        <Button onClick={() => router.push("/account/products/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products List/Grid */}
      {loading ? (
        <SkeletonList items={5} />
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-zinc-300" />
          <h3 className="mt-4 text-lg font-medium text-zinc-900">No products yet</h3>
          <p className="mt-2 text-sm text-zinc-500">Add your first product to get started</p>
          <Button onClick={() => router.push("/account/products/new")} className="mt-4">
            Add Product
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group relative rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-zinc-100 rounded-lg mb-3 overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-zinc-300" />
                  </div>
                )}
              </div>
              <h3 className="font-medium text-zinc-900 truncate">{product.name}</h3>
              <p className="text-sm font-bold text-emerald-600 mt-1">
                {formatCurrency(product.sale_price ?? product.price)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{product.stock ?? 0} in stock</p>

              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => router.push(`/account/products/${product.id}`)}
                  className="p-1.5 bg-white rounded-lg shadow hover:bg-zinc-50"
                >
                  <Edit className="h-4 w-4 text-zinc-500" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{product.name}</p>
                        <p className="text-xs text-zinc-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-900">{formatCurrency(product.sale_price ?? product.price)}</span>
                    {product.sale_price && (
                      <span className="ml-2 text-xs text-zinc-400 line-through">{formatCurrency(product.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{product.stock ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      product.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                    )}>
                      {product.is_active !== false ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="p-2 hover:bg-zinc-100 rounded-lg"
                      >
                        <Eye className="h-4 w-4 text-zinc-400" />
                      </Link>
                      <button
                        onClick={() => router.push(`/account/products/${product.id}`)}
                        className="p-2 hover:bg-zinc-100 rounded-lg"
                      >
                        <Edit className="h-4 w-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
