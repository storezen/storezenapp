"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariant } from "@/types";

type OptionGroup = {
  id: string;
  name: string;
  values: string[];
};

type CellDraft = {
  price: string;
  stock: string;
  sku: string;
};

function generateCombinations(options: string[][]): { combo: string[]; key: string }[] {
  if (!options.length) return [];
  if (options.length === 1) {
    return options[0]!.map((v) => ({ combo: [v], key: v }));
  }
  const [first, ...rest] = options;
  const sub = generateCombinations(rest);
  return first!.flatMap((head) =>
    sub.map((s) => ({ combo: [head, ...s.combo], key: [head, ...s.combo].join(" / ") })),
  );
}

const SAMPLE: ProductVariant[] = [];

type Props = {
  value: string;
  onChange: (json: string) => void;
  basePrice: string;
  baseStock: string;
};

export function VariantMatrixBuilder({ value, onChange, basePrice, baseStock }: Props) {
  const [groups, setGroups] = useState<OptionGroup[]>([
    { id: "1", name: "Color", values: ["Black", "White"] },
    { id: "2", name: "Size", values: ["S", "M", "L"] },
  ]);

  const parsed = useMemo((): Map<string, ProductVariant> => {
    if (!value.trim()) return new Map();
    try {
      const arr = JSON.parse(value);
      if (!Array.isArray(arr)) return new Map();
      return new Map(arr.map((v: ProductVariant) => [v.name || v.id, v]));
    } catch {
      return new Map();
    }
  }, [value]);

  const rows = useMemo(() => {
    const opts = groups.filter((g) => g.name.trim() && g.values.length > 0).map((g) => g.values);
    if (!opts.length) return [];
    return generateCombinations(opts as string[][]);
  }, [groups]);

  function updateGroupName(id: string, name: string) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, name } : g)));
  }

  function updateGroupValues(id: string, raw: string) {
    const vals = raw.split(",").map((v) => v.trim()).filter(Boolean);
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, values: vals } : g)));
  }

  function removeGroup(id: string) {
    setGroups((gs) => gs.filter((g) => g.id !== id));
  }

  function addGroup() {
    setGroups((gs) => [
      ...gs,
      { id: crypto.randomUUID(), name: "", values: [] },
    ]);
  }

  function updateCell(key: string, field: keyof CellDraft, rawVal: string) {
    const existing = parsed.get(key);
    const base: ProductVariant = existing
      ? { id: existing.id, name: existing.name, price: existing.price, stock: existing.stock, sku: existing.sku }
      : { id: key, name: key, price: 0, stock: 0 };
    const num = rawVal === "" ? 0 : Number(rawVal);
    const updated: ProductVariant = field === "price"
      ? { ...base, price: isNaN(num) ? 0 : num }
      : field === "stock"
      ? { ...base, stock: isNaN(num) ? 0 : num }
      : { ...base, sku: rawVal };
    const next = new Map(parsed);
    next.set(key, updated);
    const arr = Array.from(next.values());
    onChange(JSON.stringify(arr, null, 2));
  }

  function toggleCell(key: string) {
    const next = new Map(parsed);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.set(key, { id: key, name: key, price: 0, stock: 0 });
    }
    const arr = Array.from(next.values());
    onChange(JSON.stringify(arr, null, 2));
  }

  const allSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every((r) => parsed.has(r.key));
  }, [rows, parsed]);

  function toggleAll() {
    if (allSelected) {
      onChange("[]");
    } else {
      const arr = rows.map((r) => ({ id: r.key, name: r.key, price: 0, stock: 0 }));
      onChange(JSON.stringify(arr, null, 2));
    }
  }

  const enabledCount = parsed.size;
  const totalCount = rows.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-zinc-600">Option groups</p>
        <Button
          type="button"
          variant="ghost"
          size="dense"
          onClick={addGroup}
          className="h-7 gap-1 text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Add option
        </Button>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-2">
            <div className="flex flex-col gap-1">
              <Input
                placeholder="Option name"
                value={g.name}
                onChange={(e) => updateGroupName(g.id, e.target.value)}
                className="h-8 w-24 text-[11px]"
              />
              <button
                type="button"
                onClick={() => removeGroup(g.id)}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <Input
                placeholder="Comma-separated values, e.g. Black, White"
                value={g.values.join(", ")}
                onChange={(e) => updateGroupValues(g.id, e.target.value)}
                className="h-8 text-[11px]"
              />
              <p className="mt-0.5 text-[10px] text-zinc-400">{g.values.length} option{g.values.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2">
            <p className="text-[11px] text-zinc-600">
              <span className="font-semibold">{enabledCount}</span> / {totalCount} combinations enabled
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900"
            >
              {allSelected ? "Disable all" : "Enable all"}
            </button>
          </div>

          <div className="max-h-64 overflow-auto rounded-lg border border-zinc-200">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="sticky top-0 w-8 px-2 py-1.5 text-left">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  {groups.map((g) => (
                    <th key={g.id} className="sticky top-0 whitespace-nowrap px-2 py-1.5 text-left font-semibold text-zinc-500">
                      {g.name || "Option"}
                    </th>
                  ))}
                  <th className="sticky top-0 whitespace-nowrap px-2 py-1.5 text-right font-semibold text-zinc-500">Price</th>
                  <th className="sticky top-0 whitespace-nowrap px-2 py-1.5 text-right font-semibold text-zinc-500">Stock</th>
                  <th className="sticky top-0 whitespace-nowrap px-2 py-1.5 text-right font-semibold text-zinc-500">SKU</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cell = parsed.get(r.key);
                  const enabled = Boolean(cell);
                  return (
                    <tr key={r.key} className={cn("border-b border-zinc-50", !enabled && "opacity-50")}>
                      <td className="px-2 py-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5"
                          checked={enabled}
                          onChange={() => toggleCell(r.key)}
                        />
                      </td>
                      {r.combo.map((v, i) => (
                        <td key={i} className="whitespace-nowrap px-2 py-1.5 text-zinc-700">{v}</td>
                      ))}
                      {[...Array(Math.max(0, groups.length - r.combo.length))].map((_, i) => (
                        <td key={`empty-${i}`} className="px-2 py-1.5 text-zinc-300">—</td>
                      ))}
                      <td className="px-1 py-1.5">
                        <input
                          type="number"
                          disabled={!enabled}
                          value={cell?.price ?? basePrice}
                          onChange={(e) => updateCell(r.key, "price", e.target.value)}
                          placeholder={basePrice || "0"}
                          className="w-full rounded border border-zinc-200 bg-white px-1.5 py-1 text-right text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-zinc-50"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          type="number"
                          disabled={!enabled}
                          value={cell?.stock ?? baseStock}
                          onChange={(e) => updateCell(r.key, "stock", e.target.value)}
                          placeholder={baseStock || "0"}
                          className="w-full rounded border border-zinc-200 bg-white px-1.5 py-1 text-right text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-zinc-50"
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          type="text"
                          disabled={!enabled}
                          value={cell?.sku ?? ""}
                          onChange={(e) => updateCell(r.key, "sku", e.target.value)}
                          placeholder="—"
                          className="w-full rounded border border-zinc-200 bg-white px-1.5 py-1 text-right text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-zinc-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <details className="text-[11px] text-zinc-400">
            <summary className="cursor-pointer font-medium text-zinc-500 hover:text-zinc-700">
              View JSON output
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] text-zinc-600">
              {value || "[]"}
            </pre>
          </details>
        </>
      )}

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-6 text-center text-[11px] text-zinc-400">
          Add option groups above to generate variant combinations.
        </p>
      )}
    </div>
  );
}
