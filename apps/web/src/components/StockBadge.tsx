export function StockBadge({ stock }: { stock: number }) {
  const ok = stock > 0;
  return <span className={`rounded px-2 py-1 text-xs ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{ok ? `${stock} in stock` : "Out of stock"}</span>;
}
