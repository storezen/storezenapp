import { Button } from "@/components/ui/button";
import type { CartItem as Item } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function CartItem({ item, onPlus, onMinus, onRemove }: { item: Item; onPlus: () => void; onMinus: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-card">
      <div>
        <p className="font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
        <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">COD Available</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={onMinus}>-</Button>
        <span>{item.qty}</span>
        <Button size="sm" variant="secondary" onClick={onPlus}>+</Button>
        <Button size="sm" className="bg-error hover:bg-error" onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}
