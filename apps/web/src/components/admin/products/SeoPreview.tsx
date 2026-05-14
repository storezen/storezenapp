"use client";

import { useMemo } from "react";
import { Search, Globe, Smartphone } from "lucide-react";

type Props = {
  title: string;
  description: string;
  url?: string;
  storeName?: string;
};

export function SeoPreview({ title, description, url = "https://storezen.pk/products/example-product", storeName = "Storezen Store" }: Props) {
  const metaTitle = title || "(product title)";
  const metaDesc = description || "(product description will appear here)";
  const displayUrl = url;

  const desktopStyle = useMemo(() => ({
    title: metaTitle.length > 60 ? `${metaTitle.slice(0, 57)}…` : metaTitle,
    desc: metaDesc.length > 160 ? `${metaDesc.slice(0, 157)}…` : metaDesc,
  }), [metaTitle, metaDesc]);

  return (
    <div className="space-y-3">
      {/* Desktop preview */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="ml-2 flex flex-1 items-center gap-2 rounded bg-white px-3 py-1 shadow-inner">
            <Globe className="h-3 w-3 shrink-0 text-zinc-400" strokeWidth={2} />
            <span className="truncate text-[11px] text-zinc-500">{displayUrl}</span>
          </div>
        </div>
        <div className="p-4">
          <p className="mb-1 truncate text-sm font-medium text-blue-700 hover:underline">{desktopStyle.title}</p>
          <p className="text-[11px] text-emerald-700">{displayUrl}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">{desktopStyle.desc}</p>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-1.5">
          <Smartphone className="h-3.5 w-3.5 text-zinc-400" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-zinc-400">Mobile</span>
        </div>
        <div className="p-3">
          <p className="mb-0.5 truncate text-xs font-medium text-blue-700 hover:underline">{desktopStyle.title}</p>
          <p className="text-[10px] text-emerald-700">{displayUrl}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600 line-clamp-2">{desktopStyle.desc}</p>
        </div>
      </div>

      {/* Character counts */}
      <div className="flex gap-3 text-[10px]">
        <span className={cn("text-zinc-400", metaTitle.length > 60 && "text-red-500 font-semibold")}>
          Title: {metaTitle.length}/60
        </span>
        <span className={cn("text-zinc-400", metaDesc.length > 160 && "text-red-500 font-semibold")}>
          Description: {metaDesc.length}/160
        </span>
      </div>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
