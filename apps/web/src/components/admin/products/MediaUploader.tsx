"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
  className?: string;
};

/**
 * Reorderable image URL grid (no binary upload — paste CDN URLs; drag to sort).
 */
export function MediaUploader({ urls, onChange, className }: Props) {
  const [dragI, setDragI] = useState<number | null>(null);
  const [addUrl, setAddUrl] = useState("");

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...urls];
      const [item] = next.splice(from, 1);
      if (item === undefined) return;
      next.splice(to, 0, item);
      onChange(next);
    },
    [urls, onChange],
  );

  function removeAt(i: number) {
    onChange(urls.filter((_, j) => j !== i));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[11px] text-zinc-500">
        Add image links (first = cover). Drag cards to change order. Your host or CDN returns HTTPS URLs.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <input
          type="url"
          className="min-w-[200px] flex-1 rounded-md border border-zinc-200 px-2 py-1.5 text-[12px] text-zinc-800"
          placeholder="https://…"
          value={addUrl}
          onChange={(e) => setAddUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const u = addUrl.trim();
              if (u) {
                onChange([...urls, u]);
                setAddUrl("");
              }
            }
          }}
        />
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
          onClick={() => {
            const u = addUrl.trim();
            if (u) {
              onChange([...urls, u]);
              setAddUrl("");
            }
          }}
        >
          Add
        </button>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {urls.map((u, i) => (
          <li
            key={`${i}-${u.slice(0, 24)}`}
            draggable
            onDragStart={() => setDragI(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragI === null) return;
              move(dragI, i);
              setDragI(null);
            }}
            className="group relative aspect-[4/5] cursor-grab overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 active:cursor-grabbing"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin only */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-md bg-white/90 px-1.5 text-[10px] font-bold text-rose-600 shadow opacity-0 transition group-hover:opacity-100"
              onClick={() => removeAt(i)}
            >
              ×
            </button>
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">{i + 1}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
