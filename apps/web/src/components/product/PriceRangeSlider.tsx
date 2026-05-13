"use client";

import { useCallback, useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  step?: number;
  className?: string;
};

export function PriceRangeSlider({ min = 0, max = 50000, value, onChange, step = 500, className }: Props) {
  const [local, setLocal] = useState<[number, number]>(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleMin(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(Number(e.target.value), local[1] - step);
    setLocal([v, local[1]]);
  }

  function handleMax(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.max(Number(e.target.value), local[0] + step);
    setLocal([local[0], v]);
  }

  const handleCommit = useCallback(() => {
    onChange(local);
  }, [local, onChange]);

  const minPct = ((local[0] - min) / (max - min)) * 100;
  const maxPct = ((local[1] - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Labels */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-700">{formatCurrency(local[0])}</span>
        <span className="text-zinc-300">—</span>
        <span className="font-medium text-zinc-700">{local[1] >= max ? `${formatCurrency(local[1])}+` : formatCurrency(local[1])}</span>
      </div>

      {/* Range track */}
      <div className="relative h-6">
        {/* Track background */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200" />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-900"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local[0]}
          onChange={handleMin}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="range-thumb pointer-events-none absolute top-0 h-full w-full appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 [&::-moz-range-thumb]:bg-white"
          aria-label="Minimum price"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local[1]}
          onChange={handleMax}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          className="range-thumb pointer-events-none absolute top-0 h-full w-full appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900 [&::-moz-range-thumb]:bg-white"
          aria-label="Maximum price"
        />
      </div>

      {/* Min/Max inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-medium text-zinc-500">Min</label>
          <input
            type="number"
            min={min}
            max={local[1] - step}
            value={local[0]}
            onChange={(e) => {
              const v = Math.max(min, Math.min(Number(e.target.value), local[1] - step));
              setLocal([v, local[1]]);
            }}
            onBlur={handleCommit}
            className="mt-0.5 h-9 w-full rounded-lg border border-zinc-200 px-2 text-[12px] tabular-nums focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <span className="mt-4 text-zinc-300">—</span>
        <div className="flex-1">
          <label className="text-[10px] font-medium text-zinc-500">Max</label>
          <input
            type="number"
            min={local[0] + step}
            max={max}
            value={local[1]}
            onChange={(e) => {
              const v = Math.min(max, Math.max(Number(e.target.value), local[0] + step));
              setLocal([local[0], v]);
            }}
            onBlur={handleCommit}
            className="mt-0.5 h-9 w-full rounded-lg border border-zinc-200 px-2 text-[12px] tabular-nums focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </div>
    </div>
  );
}