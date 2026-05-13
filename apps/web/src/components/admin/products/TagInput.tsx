"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  className?: string;
};

/**
 * Comma-style tags; shows datalist of existing tags from the catalog.
 */
export function TagInput({ value, onChange, placeholder, suggestions, className }: Props) {
  const [open, setOpen] = useState(false);
  const listId = "tag-suggestions";
  const uniq = useMemo(() => [...new Set(suggestions.map((s) => s.trim()).filter(Boolean))].slice(0, 40), [suggestions]);

  return (
    <div className={cn("space-y-1", className)}>
      <input
        list={listId}
        className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-[12px] text-zinc-800"
        placeholder={placeholder ?? "e.g. smartwatch, gift, new"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && uniq.length > 0 ? (
        <p className="text-[10px] text-zinc-400">Tip: pick a suggestion or type and separate with commas.</p>
      ) : null}
      <datalist id={listId}>
        {uniq.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
