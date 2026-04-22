"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";

export default function HomePage() {
  const { products, isLoading, error } = useProducts();
  const featured = products.slice(0, 8);
  const categories = [
    { name: "Clothing", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900&auto=format&fit=crop" },
    { name: "Sneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop" },
    { name: "Accessories", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=900&auto=format&fit=crop" },
    { name: "Watches", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=900&auto=format&fit=crop" },
    { name: "Bags", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=900&auto=format&fit=crop" },
  ];

  return (
    <div className="space-y-12 pb-6">
      <section className="-mx-4 gradient-hero relative flex min-h-[60vh] items-center overflow-hidden text-white md:-mx-6 md:min-h-[80vh] lg:-mx-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1800&auto=format&fit=crop')] bg-cover bg-center opacity-35" />
        <div className="shop-container relative z-10 py-12">
          <p className="text-sm text-white/85">Premium Pakistani Store</p>
          <h1 className="section-title mt-3 max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">
            Smart Style For Everyday Living
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            Discover curated products with clean design, secure checkout, and fast nationwide delivery.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/products"><Button size="lg" className="bg-white text-black hover:bg-gray-100">Shop Now</Button></Link>
            <Link href="/products"><Button size="lg" variant="secondary">View All</Button></Link>
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="space-y-6">
        <h2 className="section-title text-center text-2xl font-bold text-[#1a1a1a] md:text-3xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((cat) => (
            <Link key={cat.name} href="/products" className="group">
              <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-smooth group-hover:scale-[1.03]" />
              </div>
              <p className="mt-2 text-center text-xs font-semibold uppercase tracking-wide text-[#1a1a1a]">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="section-title text-2xl font-bold text-[#1a1a1a] md:text-3xl">Featured Products</h2>
          <Link className="text-sm font-medium text-secondary hover:text-[#1a1a1a]" href="/products">View all</Link>
        </div>
      </section>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
    </div>
  );
}
