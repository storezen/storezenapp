"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { products, isLoading, error } = useProducts();
  const featured = products.slice(0, 8);
  const bestSellers = products.slice(8, 12);

  return (
    <div className="space-y-10 pb-6">
      <section className="gradient-hero relative overflow-hidden rounded-xl text-white md:h-[500px]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <span className="absolute right-4 top-4 z-20 rounded-full bg-error px-3 py-1 text-xs font-semibold text-white">Flash Sale</span>
        <div className="relative z-10 flex h-full flex-col justify-center px-6 py-14 text-center md:px-12 md:py-20 md:text-left">
          <p className="text-sm uppercase tracking-widest text-white/80">Premium Pakistani Store</p>
          <h1 className="heading-font mt-3 max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">
            Smart Style For Everyday Living
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">
            Discover curated products with clean design, secure checkout, and fast nationwide delivery.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Link href="/products"><Button size="lg">Shop Now</Button></Link>
            <Link href="/products"><Button size="lg" variant="secondary">View Sale</Button></Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Free Delivery", "Rs. 1500+ orders", "🚚"],
          ["Easy Returns", "7 day policy", "↩"],
          ["Secure Payment", "100% safe", "🔒"],
          ["24/7 Support", "WhatsApp support", "✆"],
        ].map(([title, subtitle, icon]) => (
          <div key={title} className="rounded-lg border border-gray-100 bg-white p-4 text-center shadow-card">
            <div className="mb-2 text-xl">{icon}</div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="heading-font text-2xl font-extrabold text-primary md:text-3xl">Featured Products</h2>
          <Link className="text-sm font-semibold text-accent" href="/products">View all</Link>
        </div>
      </section>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {featured.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>

      <section className="overflow-hidden rounded-xl bg-primary text-white">
        <div className="grid items-center gap-4 md:grid-cols-2">
          <div className="space-y-3 p-6 md:p-10">
            <h3 className="heading-font text-2xl font-bold">Cash on Delivery Available Nationwide</h3>
            <p className="text-sm text-white/85">No advance payment needed. Order now and pay when your parcel arrives.</p>
            <Link href="/products"><Button variant="secondary">Explore Deals</Button></Link>
          </div>
          <img src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop" alt="Promotion" className="h-48 w-full object-cover md:h-full" />
        </div>
      </section>

      <section className="rounded-xl bg-gray-50 p-6 md:p-10">
        <h3 className="heading-font text-center text-2xl font-extrabold text-primary">Shop By Category</h3>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {["Clothing", "Footwear", "Accessories", "Lifestyle"].map((cat) => (
            <Link key={cat} href="/products" className="rounded-lg bg-white p-4 text-center text-sm font-semibold shadow-card transition-smooth hover:bg-accent hover:text-white">
              {cat}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="heading-font text-2xl font-extrabold text-primary md:text-3xl">Best Sellers</h2>
          <Link className="text-sm font-semibold text-accent" href="/products">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-card md:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="heading-font text-2xl font-extrabold text-primary">Get Updates & Offers</h3>
          <p className="text-sm text-gray-500">Join our newsletter for new arrivals and exclusive deals.</p>
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <input className="h-12 flex-1 rounded-md border border-gray-300 px-4 text-sm" placeholder="Enter your email" />
            <Button className="h-12 px-6">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
