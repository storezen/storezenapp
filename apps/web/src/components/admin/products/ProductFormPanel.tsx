"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAdminUI } from "@/contexts/AdminUIContext";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { MediaUploader } from "./MediaUploader";
import { TagInput } from "./TagInput";
import { VariantMatrixBuilder } from "./VariantMatrixBuilder";
import { SeoPreview } from "./SeoPreview";

type Tab = "basic" | "media" | "pricing" | "inventory" | "org" | "status" | "seo";

type ColRow = { id: string; name: string; collectionKind?: string | null };

type Draft = {
  name: string;
  description: string;
  productType: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  lowStock: string;
  sku: string;
  barcode: string;
  trackInventory: boolean;
  category: string;
  tags: string;
  images: string[];
  variantsJson: string;
  metaTitle: string;
  metaDesc: string;
  isDraft: boolean;
  isFeatured: boolean;
  vendor: string;
  collectionIds: string[];
  publishAt: string;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  productType: "General",
  price: "",
  salePrice: "",
  costPrice: "",
  stock: "0",
  lowStock: "5",
  sku: "",
  barcode: "",
  trackInventory: true,
  category: "General",
  tags: "",
  images: [],
  variantsJson: "",
  metaTitle: "",
  metaDesc: "",
  isDraft: false,
  isFeatured: false,
  vendor: "",
  collectionIds: [],
  publishAt: "",
};

function productToDraft(p: Product, collectionIds: string[] = p.collection_ids ?? []): Draft {
  return {
    name: p.name,
    description: p.description || "",
    productType: p.product_type || p.category || "General",
    price: String(p.price),
    salePrice: p.sale_price != null ? String(p.sale_price) : "",
    costPrice: p.cost_price != null ? String(p.cost_price) : "",
    stock: String(p.stock ?? 0),
    lowStock: String(p.low_stock_threshold ?? 5),
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    trackInventory: p.track_inventory !== false,
    category: p.category || "General",
    tags: (p.tags?.length ? p.tags : []).join(", "),
    images: p.images?.length ? [...p.images] : [],
    variantsJson: p.variants?.length ? JSON.stringify(p.variants, null, 2) : "",
    metaTitle: p.meta_title ?? "",
    metaDesc: p.meta_desc ?? "",
    isDraft: Boolean(p.is_draft),
    isFeatured: p.is_featured ?? false,
    vendor: p.vendor ?? "",
    collectionIds: [...collectionIds],
    publishAt: p.publish_at ? new Date(p.publish_at).toISOString().slice(0, 16) : "",
  };
}

function draftToBody(d: Draft, mode: "create" | "edit") {
  let variants: unknown;
  if (d.variantsJson.trim()) {
    try {
      const p = JSON.parse(d.variantsJson) as unknown;
      if (Array.isArray(p)) variants = p;
    } catch {
      variants = undefined;
    }
  }
  const base: Record<string, unknown> = {
    name: d.name.trim(),
    description: d.description || null,
    price: Number(d.price),
    salePrice: d.salePrice ? Number(d.salePrice) : null,
    costPrice: d.costPrice ? Number(d.costPrice) : null,
    stock: d.trackInventory ? Number(d.stock) || 0 : 0,
    lowStockThreshold: Number(d.lowStock) || 5,
    category: d.category || d.productType || null,
    productType: d.productType?.trim() || d.category || null,
    images: d.images,
    metaTitle: d.metaTitle || null,
    metaDesc: d.metaDesc || null,
    isDraft: d.isDraft,
    isActive: d.isDraft ? false : true,
    isFeatured: d.isFeatured,
    tags: d.tags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean),
    vendor: d.vendor?.trim() || null,
    sku: d.sku?.trim() || null,
    barcode: d.barcode?.trim() || null,
    trackInventory: d.trackInventory,
    collectionIds: d.collectionIds,
    sortOrder: 0,
    publishAt: d.publishAt ? new Date(d.publishAt) : null,
  };
  if (variants) base.variants = variants;
  return base;
}

type Props = {
  mode: "create" | "edit";
  product: Product | null;
  tagSuggestions: string[];
  onCancel: () => void;
  onSaved: () => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "media", label: "Media" },
  { id: "pricing", label: "Pricing" },
  { id: "inventory", label: "Inventory" },
  { id: "org", label: "Organization" },
  { id: "status", label: "Status" },
  { id: "seo", label: "SEO" },
];

export function ProductFormPanel({ mode, product, tagSuggestions, onCancel, onSaved }: Props) {
  const { pushToast } = useAdminUI();
  const [tab, setTab] = useState<Tab>("basic");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [cols, setCols] = useState<ColRow[]>([]);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");

  useEffect(() => {
    void authFetch("/store-collections")
      .then((r) => {
        const list = (r as { collections?: ColRow[] }).collections ?? [];
        setCols(list.filter((c) => (c.collectionKind || "manual") === "manual"));
      })
      .catch(() => setCols([]));
  }, []);

  useEffect(() => {
    if (mode === "edit" && product) {
      const d = productToDraft(product);
      setDraft(d);
      lastSaved.current = JSON.stringify(d);
    } else {
      setDraft(emptyDraft);
      lastSaved.current = "";
    }
  }, [mode, product]);

  const previewProduct = useMemo((): Product => {
    return {
      id: "draft-preview",
      name: draft.name || "Product name",
      slug: "preview",
      price: Number(draft.price) || 0,
      sale_price: draft.salePrice ? Number(draft.salePrice) : undefined,
      stock: Number(draft.stock) || 0,
      images: draft.images.length ? draft.images : ["https://placehold.co/400x500?text=Image"],
      category: draft.productType || "General",
      description: draft.description,
      is_active: !draft.isDraft,
    };
  }, [draft]);

  const payloadHash = useMemo(() => JSON.stringify(draft), [draft]);

  const doSave = useCallback(
    async (quiet?: boolean) => {
      if (!draft.name.trim() || draft.price === "") {
        if (!quiet) pushToast("Add a name and price first");
        return;
      }
      if (draft.variantsJson.trim()) {
        try {
          const p = JSON.parse(draft.variantsJson) as unknown;
          if (!Array.isArray(p)) throw new Error("variants must be an array");
        } catch {
          if (!quiet) pushToast("Variants JSON is invalid");
          return;
        }
      }
  const body = draftToBody(draft, mode);
  if (body.variants == null && draft.variantsJson.trim()) {
    if (!quiet) pushToast("Fix variants JSON or clear the field");
    return;
  }
  setSaving(true);
  try {
    if (mode === "create") {
      await authFetch("/products", { method: "POST", body: JSON.stringify(body) });
    } else if (product) {
      await authFetch(`/products/${product.id}`, { method: "PUT", body: JSON.stringify(body) });
    }
    lastSaved.current = JSON.stringify(draft);
    if (quiet) pushToast("Saved");
    else onSaved();
      } catch (err) {
        if (!quiet) pushToast(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [draft, mode, product, onSaved, pushToast],
  );

  useEffect(() => {
    if (mode !== "edit" || !product?.id) return;
    if (payloadHash === lastSaved.current) return;
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      void doSave(true);
    }, 3200);
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [payloadHash, mode, product?.id, doSave]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await doSave(false);
  }

  const manualList = useMemo(
    () => cols.map((c) => ({ id: c.id, name: c.name, checked: draft.collectionIds.includes(c.id) })),
    [cols, draft.collectionIds],
  );

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden rounded-lg border border-zinc-200 bg-zinc-50/80 p-0.5 pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-2.5 text-[12px] font-semibold sm:px-2.5 sm:py-1.5",
                tab === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 active:text-zinc-900 hover:text-zinc-800",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "basic" && (
          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
            <label className="text-[11px] font-medium text-zinc-500">Title</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              required
              className="text-sm"
            />
            <label className="text-[11px] font-medium text-zinc-500">Description</label>
            <textarea
              className="min-h-[100px] w-full rounded-md border border-zinc-200 p-2 text-[12px] text-zinc-800"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Describe the product. Line breaks are kept on the product page."
            />
            <label className="text-[11px] font-medium text-zinc-500">Product type</label>
            <Input
              value={draft.productType}
              onChange={(e) => setDraft((d) => ({ ...d, productType: e.target.value }))}
              placeholder="e.g. Accessory, Smartwatch"
            />
          </section>
        )}

        {tab === "media" && (
          <section className="rounded-lg border border-zinc-200 bg-white p-3">
            <MediaUploader
              urls={draft.images}
              onChange={(images) => setDraft((d) => ({ ...d, images }))}
            />
          </section>
        )}

        {tab === "pricing" && (
          <section className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Price (PKR)</label>
              <Input
                type="number"
                required
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Compare-at price (optional)</label>
              <Input
                type="number"
                value={draft.salePrice}
                onChange={(e) => setDraft((d) => ({ ...d, salePrice: e.target.value }))}
                placeholder="Was"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Cost (optional)</label>
              <Input
                type="number"
                value={draft.costPrice}
                onChange={(e) => setDraft((d) => ({ ...d, costPrice: e.target.value }))}
                placeholder="Your cost"
              />
            </div>
          </section>
        )}

        {tab === "inventory" && (
          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 sm:max-w-md">
            <label className="flex items-center gap-2 text-[12px] text-zinc-700">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={draft.trackInventory}
                onChange={(e) => setDraft((d) => ({ ...d, trackInventory: e.target.checked }))}
              />
              Track inventory
            </label>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Stock quantity</label>
              <Input
                type="number"
                value={draft.stock}
                onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                disabled={!draft.trackInventory}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">SKU (optional)</label>
              <Input
                value={draft.sku}
                onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                placeholder="e.g. ZVK-BLK-001"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Barcode / UPC</label>
              <Input
                value={draft.barcode}
                onChange={(e) => setDraft((d) => ({ ...d, barcode: e.target.value }))}
                placeholder="e.g. 012345678901"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-zinc-500">Low stock alert at</label>
              <Input
                type="number"
                value={draft.lowStock}
                onChange={(e) => setDraft((d) => ({ ...d, lowStock: e.target.value }))}
              />
            </div>
            <div className="border-t border-zinc-200 pt-3">
              <p className="mb-2 text-[11px] font-semibold text-zinc-600">Product variants</p>
              <VariantMatrixBuilder
                value={draft.variantsJson}
                onChange={(v) => setDraft((d) => ({ ...d, variantsJson: v }))}
                basePrice={draft.price}
                baseStock={draft.stock}
              />
            </div>
          </section>
        )}

        {tab === "org" && (
          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
            <label className="text-[11px] font-medium text-zinc-500">Vendor</label>
            <Input
              value={draft.vendor}
              onChange={(e) => setDraft((d) => ({ ...d, vendor: e.target.value }))}
              placeholder="Your brand or supplier"
            />
            <label className="text-[11px] font-medium text-zinc-500">Category (storefront filter)</label>
            <Input
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            />
            <label className="text-[11px] font-medium text-zinc-500">Tags</label>
            <TagInput
              value={draft.tags}
              onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
              suggestions={tagSuggestions}
            />
            <p className="text-[11px] font-medium text-zinc-500">Collections (manual only)</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-2">
              {manualList.length === 0 ? (
                <li className="text-[11px] text-zinc-400">No manual collections. Create one under Collections.</li>
              ) : (
                manualList.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-[12px]">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={c.checked}
                      onChange={() => {
                        setDraft((d) => ({
                          ...d,
                          collectionIds: c.checked
                            ? d.collectionIds.filter((x) => x !== c.id)
                            : [...d.collectionIds, c.id],
                        }));
                      }}
                    />
                    {c.name}
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {tab === "status" && (
          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3 sm:max-w-sm">
            <p className="text-[12px] font-medium text-zinc-800">Visibility</p>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="radio"
                className="h-3.5 w-3.5"
                checked={!draft.isDraft}
                onChange={() => setDraft((d) => ({ ...d, isDraft: false }))}
              />
              Active (on your store)
            </label>
            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="radio"
                className="h-3.5 w-3.5"
                checked={draft.isDraft}
                onChange={() => setDraft((d) => ({ ...d, isDraft: true }))}
              />
              Draft (not visible to shoppers)
            </label>
            <label className="mt-2 flex items-center gap-2 text-[12px] text-zinc-600">
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={draft.isFeatured}
                onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
              />
              Feature on home (where your theme allows)
            </label>
            <div className="mt-1">
              <label className="text-[11px] font-medium text-zinc-500">Schedule publish (optional)</label>
              <Input
                type="datetime-local"
                value={draft.publishAt}
                onChange={(e) => setDraft((d) => ({ ...d, publishAt: e.target.value }))}
                className="mt-0.5 text-xs"
              />
              <p className="mt-0.5 text-[10px] text-zinc-400">Product will auto-publish at this date</p>
            </div>
          </section>
        )}

        {tab === "seo" && (
          <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Page title (meta)"
                value={draft.metaTitle}
                onChange={(e) => setDraft((d) => ({ ...d, metaTitle: e.target.value }))}
              />
              <textarea
                className="min-h-[72px] w-full rounded-md border border-zinc-200 p-2 text-[12px]"
                placeholder="Short description for Google / social"
                value={draft.metaDesc}
                onChange={(e) => setDraft((d) => ({ ...d, metaDesc: e.target.value }))}
              />
            </div>
            <SeoPreview title={draft.metaTitle || draft.name} description={draft.metaDesc} />
          </section>
        )}

        <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex flex-wrap gap-2 border-t border-zinc-200/90 bg-white/95 py-3 backdrop-blur supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:static lg:z-0 lg:mx-0 lg:mt-1 lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
          <Button
            type="submit"
            size="dense"
            className="min-h-11 min-w-[8rem] flex-1 bg-zinc-900 text-white sm:min-w-0 sm:flex-none"
            disabled={saving}
          >
            {saving ? "…" : mode === "create" ? "Publish product" : "Save"}
          </Button>
          <Button type="button" variant="secondary" size="dense" className="min-h-11 min-w-[5rem] flex-1 sm:flex-none" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
      <div className="w-full max-w-[260px] shrink-0 space-y-2 border-t border-zinc-100 pt-4 lg:border-l lg:pl-4 lg:pt-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Store preview</p>
        <div className="max-w-[240px]">
          <ProductCard product={previewProduct} variant="preview" />
        </div>
        {draft.salePrice ? (
          <p className="text-[11px] text-zinc-500">
            Sale {formatCurrency(Number(draft.salePrice))} · was {formatCurrency(Number(draft.price) || 0)}
          </p>
        ) : null}
      </div>
    </form>
  );
}

