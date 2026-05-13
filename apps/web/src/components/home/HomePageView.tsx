"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOptionalPublicStore } from "@/contexts/PublicStoreContext";
import { getDefaultHomepageContent, sectionVisibilityClassName, type HomeBlock, type HomePageContentV1 } from "@/lib/cms/homepage-block-types";
import { usePublicCatalog } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { TrustBadges } from "@/components/TrustBadges";
import { ProductGridSkeleton } from "@/components/ProductGridSkeleton";
import { CollectionShowcase } from "@/components/home/CollectionShowcase";
import { CategoryGrid } from "@/components/home/CategoryCard";
import { cn } from "@/lib/utils";

function highlightSmartwatchWord(line: string) {
  return line.split(/(Smartwatches|smartwatches)/i).map((p, j) =>
    /^(Smartwatches|smartwatches)$/i.test(p) ? (
      <span key={j} className="text-emerald-400">
        {p}
      </span>
    ) : (
      p
    ),
  );
}

function HeroBlockView({
  block,
  heroBgY,
  visClass,
}: {
  block: Extract<HomeBlock, { type: "hero" }>;
  heroBgY: number;
  visClass: string | null;
}) {
  const s = block.settings;
  const image = s.imageUrl?.trim();
  const video = s.videoUrl?.trim();
  return (
    <section
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-[56vh] w-screen items-center overflow-hidden text-white md:min-h-[64vh]",
        visClass,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950" />
      {video ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={video}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
      ) : image ? (
        <div
          className="absolute inset-0 will-change-transform bg-cover bg-center opacity-[0.2]"
          style={{
            backgroundImage: `url('${image.replace(/'/g, "%27")}')`,
            transform: `translate3d(0, ${heroBgY}px, 0) scale(1.1)`,
            transformOrigin: "center center",
          }}
          aria-hidden
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(20,98,184,0.28),transparent_50%)]" />
      <div className="shop-container relative z-10 py-12 md:py-16">
        {s.badge ? (
          <p className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold tracking-[2px] text-emerald-400">
            ● {s.badge}
          </p>
        ) : null}
        {s.title ? (
          <h1 className="section-title mt-5 max-w-4xl text-[44px] font-extrabold leading-[1.04] tracking-[-1px] md:text-[64px]">
            {s.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {highlightSmartwatchWord(line)}
              </span>
            ))}
          </h1>
        ) : null}
        {s.subtitle ? <p className="mt-6 max-w-2xl text-[17px] leading-[1.65] text-white/88">{s.subtitle}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
          {s.primaryCta?.label ? (
            <Link href={s.primaryCta.href || "/products"}>
              <Button size="lg" className="h-14 min-w-[170px] bg-white text-[15px] font-bold text-zinc-900 hover:bg-zinc-100">
                {s.primaryCta.label}
              </Button>
            </Link>
          ) : null}
          {s.secondaryCta?.label ? (
            <Link href={s.secondaryCta.href || "/products"}>
              <Button size="lg" variant="secondary" className="h-14 min-w-[190px] text-[15px] font-bold">
                {s.secondaryCta.label}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const promoGradients: Record<string, string> = {
  gradient_blue: "from-blue-950 to-blue-800",
  gradient_dark: "from-zinc-950 to-zinc-800",
  solid: "from-zinc-800 to-zinc-800",
};

function featuredFetchLimit(blocks: HomeBlock[]): number {
  const sum = blocks
    .filter((b): b is Extract<HomeBlock, { type: "featured_products" }> => b.type === "featured_products" && b.enabled)
    .reduce((s, b) => s + Math.min(Math.max(b.settings.limit ?? 8, 1), 24), 0);
  return Math.min(Math.max(sum, 4), 24);
}

export function HomePageView({ initialContent }: { initialContent?: HomePageContentV1 | null }) {
  const ctx = useOptionalPublicStore();
  const content = initialContent ?? ctx?.homePage ?? getDefaultHomepageContent();
  const [heroBgY, setHeroBgY] = useState(0);

  const hasFeatured = useMemo(
    () => content.blocks.some((b) => b.type === "featured_products" && b.enabled),
    [content.blocks],
  );
  const fetchLimit = useMemo(() => featuredFetchLimit(content.blocks), [content.blocks]);

  const { products, isLoading, error } = usePublicCatalog({
    q: "",
    collectionId: null,
    sort: "newest",
    limit: fetchLimit,
    enabled: hasFeatured,
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const parallax = () => {
      if (mql.matches) {
        setHeroBgY(0);
        return;
      }
      setHeroBgY(window.scrollY * 0.32);
    };
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        parallax();
      });
    };
    const onMql = () => parallax();
    parallax();
    mql.addEventListener("change", onMql);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      mql.removeEventListener("change", onMql);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  let featuredCursor = 0;

  return (
    <div className="space-y-12 pb-6">
      {content.blocks.map((block) => {
        if (!block.enabled) return null;
        const vis = sectionVisibilityClassName(block);
        if (vis === "hidden") return null;

        switch (block.type) {
          case "hero":
            return <HeroBlockView key={block.id} block={block} heroBgY={heroBgY} visClass={vis} />;
          case "trust_badges":
            return (
              <div key={block.id} className={cn(vis)}>
                <TrustBadges />
              </div>
            );
          case "category_row": {
            if (block.settings.source && block.settings.source !== "default") {
              return null;
            }
            return (
              <section key={block.id} className={cn("shop-container space-y-5 md:space-y-6", vis)}>
                <div>
                  <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">Categories</h2>
                  <p className="mt-1 text-sm text-zinc-500">Shop by type — we filter the catalog for you</p>
                </div>
                <CategoryGrid />
              </section>
            );
          }
          case "featured_products": {
            const s = block.settings;
            const lim = Math.min(Math.max(s.limit ?? 8, 1), 24);
            const slice = (products ?? []).slice(featuredCursor, featuredCursor + lim);
            featuredCursor += lim;
            return (
              <section key={block.id} className={cn("shop-container space-y-4 md:space-y-5", vis)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">{s.title || "Featured Products"}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{s.subtitle || "Handpicked for you"}</p>
                  </div>
                  <Link
                    className="shrink-0 self-start border-b border-zinc-400 pb-0.5 text-sm font-medium text-zinc-800 transition-smooth hover:border-zinc-800 sm:self-auto"
                    href="/products"
                  >
                    View All →
                  </Link>
                </div>
                {isLoading && <ProductGridSkeleton count={Math.min(4, lim)} />}
                {error && <ErrorMessage message={error} />}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {slice.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            );
          }
          case "collection_showcase":
            return (
              <div key={block.id} className={cn("shop-container", vis)}>
                <CollectionShowcase introTitle={block.settings.title} introSubtitle={block.settings.subtitle} />
              </div>
            );
          case "promo_strip": {
            const s = block.settings;
            const grad = promoGradients[s.background || "gradient_blue"] ?? promoGradients.gradient_blue;
            return (
              <div key={block.id} className={cn("shop-container", vis)}>
                <section className={cn("rounded-2xl bg-gradient-to-r px-6 py-12 text-white sm:px-8 sm:py-14", grad)}>
                  {s.eyebrow ? <p className="text-xs font-bold tracking-[3px] text-emerald-400">{s.eyebrow}</p> : null}
                  {s.title ? (
                    <h3 className="section-title mt-2 text-2xl font-extrabold leading-tight sm:text-3xl md:text-5xl">
                      {s.title.split("\n").map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </h3>
                  ) : null}
                  {s.subtitle ? <p className="mt-3 text-white/80">{s.subtitle}</p> : null}
                  {s.cta?.label ? (
                    <Link href={s.cta.href || "/products"} className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white">
                      {s.cta.label}
                    </Link>
                  ) : null}
                </section>
              </div>
            );
          }
          case "marketing_banner": {
            const s = block.settings;
            const dark = s.tone !== "light";
            const img = s.imageUrl?.trim();
            return (
              <div key={block.id} className={cn("shop-container", vis)}>
                <section
                  className={cn(
                    "overflow-hidden rounded-2xl border border-zinc-200",
                    dark ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-900",
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-stretch">
                    {img ? (
                      <div
                        className="h-44 shrink-0 bg-cover bg-center md:h-auto md:w-[38%]"
                        style={{ backgroundImage: `url('${img.replace(/'/g, "%27")}')` }}
                        aria-hidden
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-8">
                      {s.eyebrow ? (
                        <p className={cn("text-xs font-bold tracking-[2px]", dark ? "text-emerald-400" : "text-emerald-600")}>{s.eyebrow}</p>
                      ) : null}
                      {s.title ? <h3 className="section-title mt-2 text-2xl font-extrabold md:text-3xl">{s.title}</h3> : null}
                      {s.subtitle ? <p className={cn("mt-2 max-w-xl text-sm", dark ? "text-white/75" : "text-zinc-600")}>{s.subtitle}</p> : null}
                      {s.cta?.label ? (
                        <Link
                          href={s.cta.href || "/products"}
                          className={cn(
                            "mt-5 inline-flex w-fit rounded-lg px-5 py-2.5 text-sm font-semibold",
                            dark ? "bg-white text-zinc-900" : "bg-zinc-900 text-white",
                          )}
                        >
                          {s.cta.label}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>
            );
          }
          case "testimonials": {
            const s = block.settings;
            const items = s.items?.length ? s.items : [];
            return (
              <section key={block.id} className={cn("shop-container", vis)}>
                {s.title ? (
                  <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">{s.title}</h2>
                ) : (
                  <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">Reviews</h2>
                )}
                <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0">
                  {items.map((it, i) => (
                    <figure
                      key={`${block.id}-${i}`}
                      className="w-[min(100%,320px)] shrink-0 snap-start rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:w-auto"
                    >
                      <blockquote className="text-sm leading-relaxed text-zinc-700">&ldquo;{it.quote}&rdquo;</blockquote>
                      <figcaption className="mt-3 text-sm font-semibold text-zinc-900">
                        {it.name}
                        {it.role ? <span className="font-normal text-zinc-500"> · {it.role}</span> : null}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            );
          }
          case "stats_kpi": {
            const s = block.settings;
            const items = s.items?.length ? s.items : [];
            return (
              <section key={block.id} className={cn("shop-container", vis)}>
                {s.title ? <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">{s.title}</h2> : null}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {items.map((it, i) => (
                    <div key={`${block.id}-${i}`} className="rounded-2xl border border-zinc-200 bg-white p-5 text-center shadow-sm">
                      <p className="section-title text-2xl font-extrabold text-zinc-900 md:text-3xl">{it.value}</p>
                      <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{it.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
          case "newsletter_signup": {
            const s = block.settings;
            return (
              <NewsletterBlock key={block.id} vis={vis} title={s.title} subtitle={s.subtitle} placeholder={s.placeholder} buttonLabel={s.buttonLabel} />
            );
          }
          case "activity_feed": {
            const s = block.settings;
            const lines = s.lines?.length ? s.lines : [];
            return (
              <section key={block.id} className={cn("shop-container", vis)}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <h2 className="section-title text-xl font-bold text-zinc-900 md:text-2xl">{s.title || "Activity"}</h2>
                  <ul className="mt-4 space-y-3 text-sm text-zinc-700">
                    {lines.map((line, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }
          case "blog_teaser": {
            const s = block.settings;
            const posts = s.posts?.length ? s.posts : [];
            return (
              <section key={block.id} className={cn("shop-container", vis)}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="section-title text-2xl font-bold text-zinc-900 md:text-3xl">{s.title || "Updates"}</h2>
                    {s.subtitle ? <p className="mt-1 text-sm text-zinc-500">{s.subtitle}</p> : null}
                  </div>
                </div>
                <ul className="mt-5 divide-y divide-border rounded-2xl border border-zinc-200 bg-white">
                  {posts.map((p, i) => (
                    <li key={i}>
                      <Link href={p.href || "#"} className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50">
                        <span>{p.title}</span>
                        <span className="text-zinc-400">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          case "rich_text": {
            const s = block.settings;
            return (
              <section key={block.id} className={cn("shop-container", vis)}>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                  {s.title ? <h2 className="section-title text-xl font-bold text-zinc-900 md:text-2xl">{s.title}</h2> : null}
                  {s.body ? (
                    <p className={cn("whitespace-pre-wrap text-sm leading-relaxed text-zinc-700", s.title ? "mt-3" : "")}>{s.body}</p>
                  ) : null}
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

function NewsletterBlock({
  vis,
  title,
  subtitle,
  placeholder,
  buttonLabel,
}: {
  vis: string | null;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonLabel?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <section className={cn("shop-container", vis)}>
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm md:p-8">
        <h2 className="section-title text-xl font-bold text-zinc-900 md:text-2xl">{title || "Stay in the loop"}</h2>
        {subtitle ? <p className="mt-2 max-w-xl text-sm text-zinc-600">{subtitle}</p> : null}
        {done ? (
          <p className="mt-4 text-sm font-medium text-emerald-600">Thanks — you&apos;re on the list.</p>
        ) : (
          <form
            className="mt-5 flex max-w-lg flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <input
              name="email"
              type="email"
              required
              placeholder={placeholder || "Email address"}
              className="h-11 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none ring-green-500/30 focus:ring-2"
            />
            <Button type="submit" className="h-11 shrink-0 px-6">
              {buttonLabel || "Subscribe"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
