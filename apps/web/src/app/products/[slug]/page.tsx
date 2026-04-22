"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { WHATSAPP } from "@/lib/constants";
import type { Product } from "@/types";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/StockBadge";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [openDesc, setOpenDesc] = useState(true);
  const { addItem } = useCart();
  const storeSlug = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

  useEffect(() => {
    apiFetch(`/products/public?store_slug=${encodeURIComponent(storeSlug)}`)
      .then((res) => {
        const data = res as { products?: Product[] } | Product[];
        const list = Array.isArray(data) ? data : (data.products ?? []);
        const found = list.find((item) => item.slug === slug);
        if (!found) throw new Error("Product not found");
        setProduct(found);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load product"));
  }, [slug, storeSlug]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <p>Loading...</p>;
  const productPrice = product.sale_price || product.price;
  const hasSale = Boolean(product.sale_price && product.sale_price < product.price);
  const saveAmount = hasSale ? product.price - productPrice : 0;
  const images = product.images?.length ? product.images : ["https://placehold.co/1000x1000?text=Product"];

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      name: product.name,
      price: productPrice,
      qty,
      image: images[activeImage] || "",
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link> / <span>{product.name}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <button className="block w-full overflow-hidden rounded-md bg-gray-100" onClick={() => setLightboxOpen(true)}>
          <img
            src={images[activeImage]}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </button>
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded border ${idx === activeImage ? "border-black" : "border-border"}`}
              onClick={() => setActiveImage(idx)}
            >
              <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-xs uppercase tracking-wide text-secondary">{product.category || "General"}</span>
        <h1 className="section-title text-3xl font-bold text-[#1a1a1a]">{product.name}</h1>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-black">{formatCurrency(productPrice)}</p>
          {product.sale_price ? <p className="text-sm text-secondary line-through">{formatCurrency(product.price)}</p> : null}
          {hasSale ? <p className="text-sm text-accent">Save {formatCurrency(saveAmount)}</p> : null}
        </div>
        <StockBadge stock={product.stock} />

        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1a1a1a]">Select Variant</p>
          <div className="grid grid-cols-3 gap-2">
            <button className="rounded-full border border-border p-2 text-sm">S</button>
            <button className="rounded-full border border-black bg-black p-2 text-sm text-white">M</button>
            <button className="rounded-full border border-border p-2 text-sm">L</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded border border-border" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
          <div className="flex h-10 w-12 items-center justify-center rounded border border-border">{qty}</div>
          <button className="h-10 w-10 rounded border border-border" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>

        <Button size="lg" className="w-full" onClick={handleAddToCart}>
          Add to Cart
        </Button>
        <a
          className="flex h-12 w-full items-center justify-center rounded-md bg-whatsapp text-sm font-semibold text-white"
          href={`https://wa.me/${WHATSAPP}?text=I want ${encodeURIComponent(product.name)}`}
        >
          WhatsApp Order
        </a>
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Cash on Delivery Available</span>
        <p className="text-sm text-secondary">Usually delivers in 2-4 days</p>
      </div>
      </div>

      <div className="rounded-md border border-border">
        <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpenDesc((v) => !v)}>
          <span className="section-title text-sm font-semibold">Description</span>
          <span>{openDesc ? "−" : "+"}</span>
        </button>
        {openDesc ? <p className="border-t border-border px-4 py-3 text-sm text-secondary">{product.description || "Premium quality product for everyday use."}</p> : null}
      </div>

      <div className="fixed bottom-[68px] left-0 right-0 z-30 border-t border-border bg-white p-3 md:hidden">
        <Button className="w-full" size="lg" onClick={handleAddToCart}>Add to Cart</Button>
      </div>

      {lightboxOpen ? (
        <button className="fixed inset-0 z-50 bg-black/85 p-4" onClick={() => setLightboxOpen(false)}>
          <img src={images[activeImage]} alt={product.name} className="mx-auto h-full max-h-[90vh] w-auto max-w-full object-contain" />
        </button>
      ) : null}
    </div>
  );
}
