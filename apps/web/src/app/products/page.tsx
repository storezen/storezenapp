"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { products, isLoading } = useProducts(search);
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);
  const [category, setCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const list = products.filter((p) => category === "All" || p.category === category);

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500">
        <Link href="/">Home</Link> / <span>Products</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="heading-font text-2xl font-bold text-primary">Products</h1>
        <Button variant="secondary" className="md:hidden" onClick={() => setShowFilters((v) => !v)}>Filters</Button>
      </div>

      <div className="grid gap-5 md:grid-cols-[260px,1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} rounded-lg border border-gray-200 bg-white p-4 shadow-card md:block`}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Search</h2>
          <Input placeholder="Search product" value={search} onChange={(e) => setSearch(e.target.value)} />
          <h2 className="mb-3 mt-5 text-sm font-semibold text-gray-700">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-primary text-white" : "border border-gray-200 bg-white text-gray-700"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          {isLoading ? <LoadingSpinner /> : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 py-3">
            <button className="h-9 w-9 rounded border border-gray-300 text-sm">1</button>
            <button className="h-9 w-9 rounded border border-gray-300 text-sm">2</button>
            <button className="h-9 w-9 rounded border border-gray-300 text-sm">3</button>
          </div>
        </div>
      </div>
    </div>
  );
}
