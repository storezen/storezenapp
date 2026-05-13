"use client";

import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { ProductsCatalog } from "./ProductsCatalog";

export default function ProductsPage() {
  return (
    <div className="shop-container py-6 pt-6 md:pt-8">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
            <ProductGridSkeleton count={8} />
          </div>
        }
      >
        <ProductsCatalog />
      </Suspense>
    </div>
  );
}