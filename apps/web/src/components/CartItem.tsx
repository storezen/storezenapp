import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as Item } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function CartItem({ item, onPlus, onMinus, onRemove }: { item: Item; onPlus: () => void; onMinus: () => void; onRemove: () => void }) {
  return (
    <div className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-900">{item.name}</p>
          <p className="mt-1 text-[13px] font-bold text-zinc-900">{formatCurrency(item.price)}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={onMinus}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" strokeWidth={2.5} />
            </button>
            <span className="w-5 text-center text-[12px] font-semibold tabular-nums text-zinc-900">{item.qty}</span>
            <button
              type="button"
              onClick={onPlus}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-zinc-900 tabular-nums">{formatCurrency(item.price * item.qty)}</span>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}