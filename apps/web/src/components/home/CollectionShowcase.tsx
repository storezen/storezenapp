"use client";

import Link from "next/link";
import { CdnImage } from "@/components/CdnImage";
import { useEffect, useState } from "react";
import { useOptionalPublicStore } from "@/contexts/PublicStoreContext";
import { listPublicCollections, listPublicProducts, type StoreCollection } from "@/services/catalog.service";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";

const STORE = process.env.NEXT_PUBLIC_STORE_SLUG || "demo";

type Row = { collection: StoreCollection; products: Product[] };

type Props = {
  /** Shown in loading skeleton; optional page-level intro. */
  introTitle?: string;
  introSubtitle?: string;
  /** Number of products per collection. Default 4. */
  productsPerCollection?: number;
};

export function CollectionShowcase({ introTitle = "Shop by collection", introSubtitle = "Top picks in each collection", productsPerCollection = 4 }: Props) {
  const catalogVersion = useOptionalPublicStore()?.catalogVersion ?? 0;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cols = await listPublicCollections(STORE);
        if (cancelled) return;
        if (cols.length === 0) {
          setRows([]);
          return;
        }
        const withProducts = await Promise.all(
          cols.map(async (c) => {
            const { products } = await listPublicProducts(STORE, {
              collectionId: c.id,
              sort: "newest",
              limit: productsPerCollection,
            });
            return { collection: c, products };
          }),
        );
        if (!cancelled) setRows(withProducts.filter((r) => r.products.length > 0));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogVersion]);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="section-title text-center text-2xl font-bold text-zinc-900">{introTitle}</h2>
        {introSubtitle ? <p className="text-center text-sm text-zinc-500">{introSubtitle}</p> : null}
        <ProductGridSkeleton count={4} />
      </section>
    );
  }
  if (rows.length === 0) return null;

  return (
    <div className="space-y-14">
      {rows.map(({ collection: c, products }) => (
        <section key={c.id} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              {c.image ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200">
                  <CdnImage src={c.image} alt="" width={48} height={48} className="object-cover" />
                </div>
              ) : null}
              <div>
                <h2 className="section-title text-xl font-extrabold text-zinc-900 md:text-2xl">{c.name}</h2>
                <p className="text-sm text-zinc-500">Top picks in this collection</p>
              </div>
            </div>
            <Link
              href={`/products?collection=${c.id}`}
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
