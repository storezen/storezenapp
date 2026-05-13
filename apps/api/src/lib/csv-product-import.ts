import {
  isShopifyCsvHeaders,
  normalizeCsvHeader,
  parseRow,
  parseCsvProducts,
  stripUtf8Bom,
  type CsvProduct,
} from "./csv-parser";

/** Canonical Vendrix simple format header keys (order matters for buildMappedCsv). */
export const TEMPLATE_CSV_HEADERS = [
  "name",
  "slug",
  "description",
  "price",
  "compare_at_price",
  "stock",
  "category",
  "vendor",
  "product_type",
  "sku",
  "image",
  "images",
  "tags",
  "status",
  "meta_title",
  "meta_desc",
  "urdu_description",
  "tiktok_caption",
  "whatsapp_text",
  "weight",
  "requires_shipping",
] as const;

export type TemplateCsvKey = (typeof TEMPLATE_CSV_HEADERS)[number];

export type ColumnMapping = Partial<Record<TemplateCsvKey, string | null>>;

const FIELD_SYNONYMS: { key: TemplateCsvKey; matches: string[] }[] = [
  { key: "name", matches: ["name", "title", "product_name", "product_title"] },
  { key: "slug", matches: ["slug", "handle", "url_handle", "permalink"] },
  { key: "description", matches: ["description", "body", "body_html", "body_(html)"] },
  { key: "price", matches: ["price", "variant_price", "selling_price"] },
  { key: "compare_at_price", matches: ["compare_at_price", "compare_price", "variant_compare_at_price", "msrp"] },
  { key: "stock", matches: ["stock", "inventory", "variant_inventory_qty", "qty", "quantity"] },
  { key: "category", matches: ["category", "type", "product_type"] },
  { key: "vendor", matches: ["vendor", "brand", "manufacturer"] },
  { key: "product_type", matches: ["product_type", "product type"] },
  { key: "sku", matches: ["sku", "barcode", "variant_sku"] },
  { key: "image", matches: ["image", "image_url", "image_src", "variant_image", "main_image", "featured_image"] },
  { key: "images", matches: ["images", "additional_images", "image_1", "image_2"] },
  { key: "tags", matches: ["tags", "tag_list"] },
  { key: "status", matches: ["status", "published", "active", "visibility"] },
  { key: "meta_title", matches: ["meta_title", "seo_title", "page_title"] },
  { key: "meta_desc", matches: ["meta_desc", "meta_description", "seo_description"] },
  { key: "urdu_description", matches: ["urdu_description", "urdu"] },
  { key: "tiktok_caption", matches: ["tiktok_caption", "tiktok"] },
  { key: "whatsapp_text", matches: ["whatsapp_text", "whatsapp"] },
  { key: "weight", matches: ["weight", "grams", "weight_grams"] },
  { key: "requires_shipping", matches: ["requires_shipping", "shipping", "fulfilled_by"] },
];

function escapeCsvField(v: string): string {
  return `"${String(v ?? "").replaceAll('"', '""')}"`;
}

export function parseRawCsvData(csv: string): { headers: string[]; headersNorm: string[]; rows: string[][] } {
  const lines = stripUtf8Bom(csv).split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 1) {
    return { headers: [], headersNorm: [], rows: [] };
  }
  const rawHeaders = parseRow(lines[0]!);
  const headersNorm = rawHeaders.map((h) => normalizeCsvHeader(h));
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]!);
    if (row.length === 0 || row.every((c) => !String(c).trim())) continue;
    const max = Math.max(rawHeaders.length, row.length);
    const pad = [];
    for (let j = 0; j < max; j++) pad.push(String(row[j] ?? ""));
    rows.push(pad);
  }
  return { headers: rawHeaders, headersNorm, rows };
}

function suggestForHeader(norm: string, taken: Set<TemplateCsvKey>): TemplateCsvKey | null {
  for (const { key, matches } of FIELD_SYNONYMS) {
    if (taken.has(key)) continue;
    for (const m of matches) {
      if (norm === m || norm.includes(m)) {
        return key;
      }
    }
  }
  return null;
}

export function analyzeStoreProductImport(csv: string) {
  const { headers, headersNorm, rows } = parseRawCsvData(csv);
  if (headers.length === 0) return { ok: false, error: "No columns found in CSV file" };

  const isShopify = isShopifyCsvHeaders(headersNorm);
  const sampleRows = rows.slice(0, 3).map((row) => {
    const pad = [];
    for (let i = 0; i < headers.length; i++) pad.push(row[i] ?? "");
    return pad;
  });

  const suggested: Record<string, string | null> = {};
  const taken = new Set<TemplateCsvKey>();
  if (isShopify) {
    const shopifyMap: Record<string, TemplateCsvKey> = {
      title: "name",
      handle: "slug",
      body_html: "description",
      variant_price: "price",
      variant_compare_at_price: "compare_at_price",
      variant_inventory_qty: "stock",
      product_type: "category",
      vendor: "vendor",
      variant_sku: "sku",
      image_src: "image",
      tags: "tags",
      status: "status",
      seo_title: "meta_title",
      seo_description: "meta_desc",
    };
    for (let i = 0; i < headersNorm.length; i++) {
      const h = headersNorm[i]!;
      const key = shopifyMap[h];
      if (key) {
        suggested[key] = headers[i] ?? null;
        taken.add(key);
      }
    }
  } else {
    for (let i = 0; i < headersNorm.length; i++) {
      const h = headersNorm[i]!;
      const key = suggestForHeader(h, taken);
      if (key) {
        suggested[key] = headers[i] ?? null;
        taken.add(key);
      }
    }
  }

  return {
    ok: true,
    isShopify,
    headers,
    rowCount: rows.length,
    sampleRows,
    suggestedMapping: suggested,
  };
}

export function resolveImportCsv(
  csv: string,
  options: {
    replaceExisting?: boolean;
    skipDuplicates?: boolean;
    isShopify?: boolean;
    columnMap?: ColumnMapping;
  },
) {
  const { isShopify, columnMap = {} } = options;
  const { headers, headersNorm, rows } = parseRawCsvData(csv);

  const getCol = (key: TemplateCsvKey): number => {
    const mapped = columnMap[key];
    if (mapped != null) {
      const idx = headers.findIndex((h) => h.toLowerCase() === mapped.toLowerCase());
      if (idx >= 0) return idx;
    }
    return headersNorm.findIndex((h) => {
      const synonyms = FIELD_SYNONYMS.find((s) => s.key === key)?.matches ?? [];
      return synonyms.includes(h);
    });
  };

  const mappedRows = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const key of TEMPLATE_CSV_HEADERS) {
      const idx = getCol(key);
      out[key] = idx >= 0 ? row[idx] ?? "" : "";
    }
    return out;
  });

  const allEmpty = mappedRows.every((r) => !r.name?.trim());
  return { csv: mappedRows, parseNote: allEmpty ? "empty" : "ok" };
}

export function buildTemplateCsv(): string {
  const lines: string[] = [];
  lines.push(TEMPLATE_CSV_HEADERS.map(escapeCsvField).join(","));
  const sample: Record<string, string> = {
    name: "Sample Product",
    slug: "sample-product",
    description: "This is a sample product description",
    price: "1000",
    compare_at_price: "1500",
    stock: "10",
    category: "Electronics",
    vendor: "Brand Name",
    product_type: "Smart Watch",
    sku: "SKU001",
    image: "https://example.com/image.jpg",
    images: "https://example.com/image1.jpg,https://example.com/image2.jpg",
    tags: "sale,new,featured",
    status: "active",
    meta_title: "Buy Sample Product",
    meta_desc: "Best quality sample product",
    urdu_description: "Urdu description here",
    tiktok_caption: "TikTok caption",
    whatsapp_text: "Order now!",
    weight: "100",
    requires_shipping: "TRUE",
  };
  lines.push(TEMPLATE_CSV_HEADERS.map((k) => escapeCsvField(sample[k] ?? "")).join(","));
  return lines.join("\n");
}

export function buildMappedCsv(
  data: { name: string; slug: string; errors?: string[] }[],
  columnMap: ColumnMapping,
): string {
  const usedHeaders = Object.values(columnMap).filter(Boolean) as string[];
  if (usedHeaders.length === 0) return "";
  const lines: string[] = [];
  lines.push(usedHeaders.map(escapeCsvField).join(","));
  return lines.join("\n");
}

// Export aliases for compatibility
export const analyzeProductImportFile = analyzeStoreProductImport;

export function buildSimpleCsvFromMapping(data: Record<string, string>[], headers: string[]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvField).join(","));
  for (const row of data) {
    lines.push(headers.map((h) => escapeCsvField(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

export function validateProductImportData(csv: string): { valid: boolean; errors: string[] } {
  const { rows } = parseRawCsvData(csv);
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (!row[0]?.trim()) {
      errors.push(`Row ${i + 1}: Missing product name`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function importSlugForRow(p: CsvProduct, idx: number): string {
  if (p.slug) return p.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (p.name) {
    return p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 60);
  }
  return `product-${idx + 1}`;
}