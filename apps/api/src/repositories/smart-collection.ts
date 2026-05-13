export type CollectionRule = {
  id: string;
  collectionId: string;
  field: string;
  operator: string;
  value: string;
};

type ProductRow = {
  price: string;
  category: string | null;
  productType: string | null;
  tags: unknown;
  isActive: boolean | null;
  isDraft: boolean | null;
};

function tagsArray(raw: unknown): string[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => String(t).toLowerCase().trim()).filter(Boolean);
}

export function productMatchesRules(p: ProductRow, rules: CollectionRule[]): boolean {
  if (rules.length === 0) return true;
  return rules.every((r) => matchOne(p, r));
}

function numPrice(price: string) {
  return Number.parseFloat(String(price)) || 0;
}

function matchOne(p: ProductRow, r: CollectionRule): boolean {
  const op = r.operator;
  const val = (r.value || "").trim();
  const field = r.field;

  if (field === "tag") {
    const list = tagsArray(p.tags);
    const v = val.toLowerCase();
    if (op === "eq" || op === "equals") return list.includes(v);
    if (op === "contains") return list.some((t) => t.includes(v));
    return list.includes(v);
  }

  if (field === "price" || field === "compare_at") {
    const n = numPrice(p.price);
    const target = Number.parseFloat(val);
    if (Number.isNaN(target)) return false;
    if (op === "gt" || op === "greater_than") return n > target;
    if (op === "gte" || op === "greater_or_equal") return n >= target;
    if (op === "lt" || op === "less_than") return n < target;
    if (op === "lte" || op === "less_or_equal") return n <= target;
    if (op === "eq" || op === "equals") return n === target;
    return false;
  }

  if (field === "product_type") {
    const cur = (p.productType || p.category || "").toLowerCase();
    const v = val.toLowerCase();
    if (op === "eq" || op === "equals" || op === "contains") return cur === v || (op === "contains" && cur.includes(v));
    return cur === v;
  }

  if (field === "category") {
    const cur = (p.category || "").toLowerCase();
    const v = val.toLowerCase();
    if (op === "eq" || op === "equals" || op === "contains") return cur === v || (op === "contains" && cur.includes(v));
    return cur === v;
  }

  return true;
}
