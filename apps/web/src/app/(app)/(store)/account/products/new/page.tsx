"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Save, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/notifications/toast-system";

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "images" | "seo">("basic");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    salePrice: "",
    costPrice: "",
    stock: "0",
    lowStockThreshold: "5",
    trackInventory: true,
    category: "",
    tags: "",
    sku: "",
    barcode: "",
    vendor: "",
    productType: "",
    urduDescription: "",
    metaTitle: "",
    metaDesc: "",
    isActive: true,
    isFeatured: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) return;

    setLoading(true);
    try {
      const productData = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        stock: parseInt(form.stock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        trackInventory: form.trackInventory,
        category: form.category || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        sku: form.sku || null,
        barcode: form.barcode || null,
        vendor: form.vendor || null,
        productType: form.productType || null,
        urduDescription: form.urduDescription || null,
        metaTitle: form.metaTitle || null,
        metaDesc: form.metaDesc || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: images,
        isDraft: !form.isActive,
      };

      const result = await authFetch("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      }) as { product?: { id: string } };

      if (result?.product?.id) {
        toast.success("Product created successfully");
        router.push(`/account/products/${result.product.id}`);
      } else {
        toast.success("Product created");
        router.push("/account/products");
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  function addImage(url: string) {
    if (url && !images.includes(url)) {
      setImages([...images, url]);
    }
    setImageUrlInput("");
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  const tabs = [
    { id: "basic", label: "Basic" },
    { id: "pricing", label: "Pricing & Stock" },
    { id: "images", label: "Images" },
    { id: "seo", label: "SEO" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/account/products" className="p-2 hover:bg-zinc-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Add New Product</h1>
          <p className="text-sm text-zinc-500">Create a new product listing</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Basic Information</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Product Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your product..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Urdu Description / تفصیل</label>
              <Textarea
                value={form.urduDescription}
                onChange={(e) => setForm({ ...form, urduDescription: e.target.value })}
                placeholder="اردو میں تفصیل لکھیں..."
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Category</label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Electronics"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Product Type</label>
                <Input
                  value={form.productType}
                  onChange={(e) => setForm({ ...form, productType: e.target.value })}
                  placeholder="e.g. Physical, Digital"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">SKU</label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Product SKU"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Barcode</label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Barcode number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Vendor / Brand</label>
                <Input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Brand name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Tags (comma separated)</label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. wireless, bluetooth, sale"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
              <h2 className="font-semibold text-zinc-900">Pricing</h2>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Regular Price (PKR) *</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Sale Price (PKR)</label>
                  <Input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Cost Price (PKR)</label>
                  <Input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
              <h2 className="font-semibold text-zinc-900">Inventory</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Stock Quantity</label>
                  <Input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Low Stock Alert</label>
                  <Input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-zinc-700">Track Inventory</p>
                  <p className="text-sm text-zinc-500">Monitor stock levels</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, trackInventory: !form.trackInventory })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.trackInventory ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.trackInventory ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === "images" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">Product Images</h2>
            <p className="text-sm text-zinc-500">Add up to 10 images. First image will be the main image.</p>

            {/* Image Grid */}
            <div className="grid grid-cols-4 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 group">
                  <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-xs text-center py-1">
                      Main
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50">
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                  <span className="text-xs text-zinc-500 mt-2">Add Image</span>
                </label>
              )}
            </div>

            {/* URL Input */}
            <div className="flex gap-2 pt-4 border-t border-zinc-100">
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addImage(imageUrlInput);
                  }
                }}
                className="flex-1"
              />
              <Button type="button" onClick={() => addImage(imageUrlInput)} variant="secondary">
                Add URL
              </Button>
            </div>
            <p className="text-xs text-zinc-500">Tip: Right-click any image online → "Copy Image Address" to get the URL</p>
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === "seo" && (
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="font-semibold text-zinc-900">SEO Settings</h2>
            <p className="text-sm text-zinc-500">Optimize your product for search engines</p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Meta Title</label>
              <Input
                value={form.metaTitle}
                onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                placeholder="Product title for search results"
              />
              <p className="text-xs text-zinc-400">{form.metaTitle.length}/60 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Meta Description</label>
              <Textarea
                value={form.metaDesc}
                onChange={(e) => setForm({ ...form, metaDesc: e.target.value })}
                placeholder="Description for search results..."
                rows={3}
              />
              <p className="text-xs text-zinc-400">{form.metaDesc.length}/160 characters</p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
          <h2 className="font-semibold text-zinc-900">Status</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700">Publish immediately</p>
              <p className="text-sm text-zinc-500">Customers can see this product</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isActive ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700">Feature product</p>
              <p className="text-sm text-zinc-500">Show on homepage</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isFeatured ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.isFeatured ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="outline" onClick={() => router.push("/account/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}