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

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        <Link href="/">Home</Link> / <Link href="/products">Products</Link> / <span>{product.name}</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.images?.[0] || "https://placehold.co/900x900?text=Product"}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-md bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <span className="inline-block rounded-full bg-primary-light px-2 py-1 text-xs font-semibold text-white">{product.category || "General"}</span>
        <h1 className="heading-font text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-sm text-warning">★★★★★ <span className="text-gray-500">(128 reviews)</span></p>
        <div className="flex items-center gap-2">
          <p className="heading-font text-2xl font-bold text-primary">{formatCurrency(productPrice)}</p>
          {product.sale_price ? <p className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</p> : null}
        </div>
        <StockBadge stock={product.stock} />
        <p className="text-sm text-gray-700">{product.description}</p>

        <div className="grid grid-cols-3 gap-2">
          <button className="rounded-md border border-gray-300 p-2 text-sm">S</button>
          <button className="rounded-md border border-primary bg-primary text-white p-2 text-sm">M</button>
          <button className="rounded-md border border-gray-300 p-2 text-sm">L</button>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded border border-gray-300">-</button>
          <div className="flex h-10 w-12 items-center justify-center rounded border border-gray-300">1</div>
          <button className="h-10 w-10 rounded border border-gray-300">+</button>
        </div>

        <Button size="lg" className="w-full" onClick={() => addItem({ product_id: product.id, name: product.name, price: productPrice, qty: 1, image: product.images?.[0] || "" })}>
          Add to Cart
        </Button>
        <a
          className="flex h-12 w-full items-center justify-center rounded-md bg-whatsapp text-sm font-semibold text-white"
          href={`https://wa.me/${WHATSAPP}?text=I want ${encodeURIComponent(product.name)}`}
        >
          Buy on WhatsApp
        </a>
        <span className="inline-block rounded-full bg-primary px-2 py-1 text-xs font-semibold text-white">Cash on Delivery Available</span>
        <p className="text-sm text-gray-600">Delivery in 2-4 days across major Pakistani cities.</p>
      </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="heading-font text-lg font-bold text-gray-900">Product Description</h2>
        <p className="mt-2 text-sm text-gray-700">{product.description || "Premium quality product for everyday use."}</p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="heading-font text-lg font-bold text-gray-900">Customer Reviews</h2>
        <p className="mt-2 text-sm text-gray-600">Customer reviews section coming soon.</p>
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="heading-font text-lg font-bold text-gray-900">Related Products</h2>
        <p className="mt-2 text-sm text-gray-600">Explore more products from this category.</p>
      </div>
    </div>
  );
}
