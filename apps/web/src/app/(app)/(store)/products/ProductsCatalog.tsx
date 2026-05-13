"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, PackageSearch } from "lucide-react";
import { usePublicCatalog } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";

export function ProductsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const spQ = searchParams.get("q") ?? "";

  const [search, setSearch] = useState(spQ);

  const { products, isLoading } = usePublicCatalog({
    collectionId: null,
    q: search,
    sort: "newest",
    limit: 100,
    infinite: false,
  });

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  }, [search, router]);

  useEffect(() => {
    const t = setTimeout(updateURL, 300);
    return () => clearTimeout(t);
  }, [updateURL]);

  useEffect(() => {
    if (spQ) setSearch(spQ);
  }, []);

  const productCount = products?.length ?? 0;

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
            <PackageSearch className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">All Products</h1>
            <p className="text-xs text-zinc-500">
              {isLoading ? "Loading..." : `${productCount} product${productCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-12 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white"
          />
          <PackageSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" strokeWidth={1.75} />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductGridSkeleton count={8} />
        </div>
      ) : !products || products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/30 py-16 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
            <PackageSearch className="h-10 w-10 text-zinc-300" strokeWidth={1.25} />
          </div>
          <p className="text-lg font-bold text-zinc-900">
            {search ? "No products found" : "No products yet"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 max-w-xs">
            {search
              ? `We couldn't find anything for "${search}". Try different keywords.`
              : "New products are coming soon. Check back later!"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500"
            >
              <X className="h-4 w-4" />
              Clear search
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product, i) => (
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