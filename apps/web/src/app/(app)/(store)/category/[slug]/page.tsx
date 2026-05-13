"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { X, PackageSearch } from "lucide-react";
import { usePublicCatalog } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { listPublicCollections, type StoreCollection } from "@/services/catalog.service";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug as string;

  const [sort, setSort] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [search, setSearch] = useState("");
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Fetch collections first
  useEffect(() => {
    listPublicCollections(STORE_SLUG)
      .then((data) => {
        setCollections(data);
        setLoadingCollections(false);
      })
      .catch(() => {
        setCollections([]);
        setLoadingCollections(false);
      });
  }, []);

  // Find collection by slug OR fallback to slug as category name
  const collection = collections.find((c) => c.slug === slug);
  const categoryName = collection?.name ?? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // If no collection found, filter by category name in product's category field
  const { products, isLoading } = usePublicCatalog({
    collectionId: collection?.id ?? null,
    q: search,
    sort: "newest",
    limit: 100,
    infinite: false,
  });

  // If no collection match, filter products client-side by category
  const filteredProducts = !collection && products
    ? products.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const slugWords = slug.split("-");
        return slugWords.some((word) => cat.includes(word));
      })
    : products;

  const sortedProducts = [...(filteredProducts ?? [])].sort((a, b) => {
    const priceA = a.sale_price ?? a.price;
    const priceB = b.sale_price ?? b.price;
    return sort === "price_asc" ? priceA - priceB : sort === "price_desc" ? priceB - priceA : 0;
  });

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest First";
  const isLoadingAll = isLoading || loadingCollections;

  return (
    <div className="space-y-5 sm:space-y-6 pb-28">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="shop-container pt-6 md:pt-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
            <PackageSearch className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">{categoryName}</h1>
            <p className="text-xs text-zinc-500">
              {isLoadingAll ? "Loading..." : `${sortedProducts.length} products`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search + Sort Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="shop-container"
      >
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in this category..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <PackageSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-600"
            >
              <span>{currentSortLabel}</span>
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border border-zinc-200 bg-white shadow-lg py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={cn(
                        "flex w-full px-3 py-2.5 text-sm",
                        sort === opt.value ? "bg-emerald-50 font-bold text-emerald-700" : "text-zinc-700 hover:bg-zinc-50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      {isLoadingAll ? (
        <div className="shop-container grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductGridSkeleton count={8} />
        </div>
      ) : !sortedProducts || sortedProducts.length === 0 ? (
        <div className="shop-container">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 py-16 text-center"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
              <PackageSearch className="h-10 w-10 text-zinc-300" strokeWidth={1.25} />
            </div>
            <p className="text-lg font-bold text-zinc-900">No products found</p>
            <p className="mt-1 text-sm text-zinc-500">No products in this category yet.</p>
          </motion.div>
        </div>
      ) : (
        <div className="shop-container grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}