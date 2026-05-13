"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PackageX } from "lucide-react";
import { useOptionalPublicStore } from "@/contexts/PublicStoreContext";
import { useAdminUI } from "@/contexts/AdminUIContext";
import { useCart } from "@/hooks/use-cart";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { authFetch } from "@/lib/api";
import type { Product, ProductVariant, ProductReview, RatingStats } from "@/types";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import { FrequentlyBoughtTogether } from "@/components/product/FrequentlyBoughtTogether";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublicProducts } from "@/services/catalog.service";
import { trackViewProduct } from "@/lib/analytics";

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

function PageSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-8 w-full rounded-xl" />
        <Skeleton className="h-6 w-32 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const catalogVersion = useOptionalPublicStore()?.catalogVersion ?? 0;
  const [product, setProduct] = useState<Product | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewStats, setReviewStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selVariantId, setSelVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const { products: recentProducts, track, clear: clearRecent } = useRecentlyViewed();

  const variantList = product?.variants && product.variants.length > 0 ? product.variants : null;
  const selected = variantList && selVariantId ? variantList.find((v) => v.id === selVariantId) ?? null : null;
  const basePrice = product ? (product.sale_price || product.price) : 0;
  const variantPrice = selected ? selected.price : basePrice;
  const stock = product ? (selected ? selected.stock : (product.stock ?? 0)) : 0;
  const hasSale = product ? Boolean(product.sale_price && product.sale_price < product.price) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalogData, reviewData] = await Promise.allSettled([
        listPublicProducts(STORE_SLUG, { limit: 200 }),
        product ? authFetch(`/products/${product.id}/reviews`).catch(() => null) : Promise.resolve(null),
      ]);

      if (catalogData.status === "fulfilled") {
        const products = catalogData.value.products;
        const found = products.find((p: Product) => p.slug === slug);
        if (!found) throw new Error("Product not found");
        setCatalog(products);
        setProduct(found);
        track(found);
        if (found.variants?.length) setSelVariantId(found.variants[0]!.id);
        else setSelVariantId(null);
        trackViewProduct(found.id, found.name, found.sale_price || found.price);
      } else {
        throw new Error("Failed to load products");
      }

      if (reviewData.status === "fulfilled" && reviewData.value) {
        const rd = reviewData.value as { reviews?: ProductReview[]; stats?: RatingStats };
        setReviews(rd.reviews ?? []);
        setReviewStats(rd.stats ?? null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const related = useMemo(
    () => catalog.filter((p) => p.slug !== slug).slice(0, 4),
    [catalog, slug],
  );

  const specs = useMemo<Record<string, string>>(() => {
    if (!product) return {};
    const s: Record<string, string> = {};
    if (product.sku) s["SKU"] = product.sku;
    if (product.category) s["Category"] = product.category;
    if (product.vendor) s["Brand"] = product.vendor;
    if (product.stock != null) s["Stock"] = `${product.stock} units`;
    if (product.tags?.length) s["Tags"] = product.tags.join(", ");
    return s;
  }, [product]);

  if (loading) {
    return (
      <div className="safe-bottom-lg space-y-8 pt-6 md:pt-8">
        <div className="shop-container">
          <div className="h-5 w-48 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="shop-container">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="safe-bottom-lg mx-auto max-w-lg px-4 pt-6 md:pt-8">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to products
        </Link>
        <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-zinc-50/50 p-10 text-center">
          <PackageX className="h-12 w-12 text-zinc-300" strokeWidth={1.25} />
          <p className="mt-4 text-lg font-semibold text-zinc-900">{error || "Product not found"}</p>
          <p className="mt-1 text-sm text-zinc-500">This product may have been removed or the link is incorrect.</p>
          <Button className="mt-6" asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["https://placehold.co/800x800?text=Product"];
  const categoryLabel = (product.category || "General").trim() || "General";

  return (
    <div className="safe-bottom-lg space-y-6 pt-4 pb-28 md:space-y-8 md:pt-6 md:pb-8 lg:pb-10">
      {/* Breadcrumb */}
      <div className="shop-container">
        <nav className="flex items-center gap-1.5 text-xs text-zinc-400" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-zinc-700">Home</Link>
          <span>/</span>
          <Link href="/products" className="transition-colors hover:text-zinc-700">Products</Link>
          {categoryLabel !== "General" && (
            <>
              <span>/</span>
              <Link href={`/products?category=${encodeURIComponent(categoryLabel)}`} className="transition-colors hover:text-zinc-700">
                {categoryLabel}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-zinc-600">{product.name}</span>
        </nav>
      </div>

      {/* Product layout */}
      <div className="shop-container space-y-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-start">
            {/* Gallery */}
            <div className="lg:sticky lg:top-4">
              <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
                <ProductImageGallery images={images} alt={product.name} />
              </div>
            </div>

            {/* Info */}
            <div className="p-0 lg:pt-0">
              <ProductInfo
                product={product}
                variantList={variantList}
                selected={selected}
                selVariantId={selVariantId}
                onSelectVariant={setSelVariantId}
              />
            </div>
          </div>
        </div>

        {/* Product tabs */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <ProductTabs
              productId={product.id}
              description={product.description || "No description available for this product."}
              specs={specs}
              reviews={reviews}
              reviewStats={reviewStats}
            />
          </div>
        </div>
      </div>

      {/* Recently viewed */}
      {recentProducts.length > 0 && (
        <div className="shop-container space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">Recently Viewed</h2>
            <button
              type="button"
              onClick={clearRecent}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-700"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recentProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <div className="shop-container space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-zinc-900 sm:text-2xl">You May Also Like</h2>
            <Link href="/products" className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Frequently bought together */}
      <FrequentlyBoughtTogether currentProductId={product.id} />

      {/* Mobile sticky add to cart */}
      <StickyAddToCart
        product={product}
        selected={selected}
        stock={stock}
        price={variantPrice}
        qty={qty}
        onQtyChange={setQty}
      />
    </div>
  );
}
