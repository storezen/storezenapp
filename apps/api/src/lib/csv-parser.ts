/**
 * CSV parser for bulk product import.
 * Supports Shopify export format and Vendrix simple format.
 */

export interface CsvProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  category: string;
  vendor?: string;
  productType?: string;
  sku?: string;
  image: string;
  images: string[];
  tags: string[];
  active: boolean;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  urduDescription?: string;
  tiktokCaption?: string;
  whatsappText?: string;
  weight?: number;
  requiresShipping?: boolean;
  variants?: unknown;
}

/** Strip leading UTF-8 BOM (Excel/Windows “CSV UTF-8” saves this). */
export function stripUtf8Bom(s: string): string {
  if (s.length > 0 && s.codePointAt(0) === 0xfeff) return s.slice(1);
  return s;
}

export function normalizeCsvHeader(h: string): string {
  return stripUtf8Bom(h.trim())
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * True Shopify product exports use columns Handle + Title (normalized).
 * We avoid `includes("handle")` so fields like `url_handle` or `product_handle`
 * are not mistaken for a Shopify file.
 */
export function isShopifyCsvHeaders(headersNorm: string[]): boolean {
  const s = new Set(headersNorm);
  if (!s.has("handle") || !s.has("title")) return false;
  return (
    s.has("variant_price") ||
    s.has("variant_sku") ||
    s.has("body_html") ||
    s.has("body_(html)") ||
    s.has("vendor") ||
    s.has("option1_name") ||
    s.has("published")
  );
}

export function parseRow(row: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeId(handle: string, name: string, index: number): string {
  const base = handle || slugify(name) || `product-${index}`;
  return base.replace(/[^a-z0-9-_]/gi, '-').slice(0, 60);
}

function parseNum(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

export function parseCsvProducts(csv: string): {
  products: CsvProduct[];
  errors: string[];
} {
  const lines = stripUtf8Bom(csv).split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { products: [], errors: ['CSV has no data rows'] };

  const headers = parseRow(lines[0]).map((h) => normalizeCsvHeader(h));

  // Detect format
  const isShopify = isShopifyCsvHeaders(headers);

  const products: CsvProduct[] = [];
  const errors: string[] = [];
  const seen = new Map<string, number>(); // id → first row index

  // For Shopify format, multiple rows per product (grouped by Handle)
  const shopifyGroups = new Map<string, string[][]>();
  const shopifyOrder: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.every(c => !c)) continue; // skip blank rows

    if (isShopify) {
      const handle = row[headers.indexOf('handle')] || '';
      if (handle) {
        if (!shopifyGroups.has(handle)) { shopifyGroups.set(handle, []); shopifyOrder.push(handle); }
        shopifyGroups.get(handle)!.push(row);
      }
    } else {
      // Simple format
      try {
        const p = parseSimpleRow(headers, row, i);
        if (p) {
          const key = p.id;
          if (!seen.has(key)) { seen.set(key, i); products.push(p); }
          else errors.push(`Row ${i + 1}: duplicate id "${key}" (first seen at row ${seen.get(key)! + 1})`);
        }
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  if (isShopify) {
    let idx = 0;
    for (const handle of shopifyOrder) {
      idx++;
      const rows = shopifyGroups.get(handle)!;
      try {
        const p = parseShopifyGroup(headers, rows, handle, idx);
        if (p) products.push(p);
      } catch (e) {
        errors.push(`Product "${handle}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { products, errors };
}

function parseShopifyGroup(headers: string[], rows: string[][], handle: string, idx: number): CsvProduct | null {
  const first = rows[0];

  function col(name: string, row = first): string {
    const i = headers.indexOf(name);
    return i >= 0 ? (row[i] ?? '') : '';
  }

  const name = col('title') || col('name');
  if (!name) return null;

  const priceStr = col('variant_price') || col('price');
  const price = parseNum(priceStr);
  if (price === 0 && !priceStr) throw new Error('Missing price');

  // Collect all image URLs from all rows
  const images: string[] = [];
  for (const row of rows) {
    const img = col('image_src', row) || col('variant_image', row) || col('image', row);
    if (img && !images.includes(img)) images.push(img);
  }

  const compareStr = col('variant_compare_at_price') || col('compare_at_price');
  const tagsStr = col('tags') || '';

  return {
    id: normalizeId(handle, name, idx),
    name,
    slug: handle || slugify(name),
    description: col('body_(html)') || col('body_html') || col('description') || undefined,
    price,
    compareAtPrice: compareStr ? parseNum(compareStr) || undefined : undefined,
    stock: parseNum(col('variant_inventory_qty') || col('stock') || '10'),
    category: col('type') || col('product_type') || col('category') || 'General',
    image: images[0] ?? '',
    images,
    tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
    active: (col('status') || col('published')).toLowerCase() !== 'false' &&
            (col('status') || col('published')).toLowerCase() !== 'draft' &&
            (col('status') || 'active').toLowerCase() !== 'archived',
    metaTitle: col('seo_title') || col('meta_title') || undefined,
    metaDescription: col('meta_desc') || col('seo_description') || col('meta_description') || undefined,
    urduDescription: col('urdu_description') || undefined,
    tiktokCaption: col('tiktok_caption') || undefined,
    whatsappText: col('whatsapp_text') || undefined,
  };
}

function parseSimpleRow(headers: string[], row: string[], rowIdx: number): CsvProduct | null {
  function col(name: string): string {
    const i = headers.indexOf(name);
    return i >= 0 ? (row[i] ?? '') : '';
  }

  const name = col('name') || col('title');
  if (!name) return null;

  const priceStr = col('price');
  if (!priceStr) throw new Error('Missing price');

  const id = col('id') || col('handle') || normalizeId('', name, rowIdx);
  const imgStr = col('image') || col('image_src') || col('image_url') || col('featured_image') || '';
  const imagesStr = col('images') || col('additional_images') || '';

  // Parse multiple images
  const imagesList = imagesStr ? imagesStr.split(',').map((img: string) => img.trim()).filter(Boolean) : [];

  // Combine main image with additional images
  const allImages = imgStr ? [imgStr, ...imagesList] : imagesList;

  // Parse status
  const statusVal = col('status');
  const active = statusVal === 'active' || statusVal === 'true' || statusVal === 'published' || col('active') !== 'false';

  // Parse requires shipping
  const requiresShipping = col('requires_shipping')?.toLowerCase() === 'true' || col('shipping')?.toLowerCase() === 'true';

  return {
    id,
    name,
    slug: col('slug') || col('handle') || slugify(name) || undefined,
    description: col('description') || col('body') || undefined,
    price: parseNum(priceStr),
    compareAtPrice: col('compare_at_price') || col('compare_price')
      ? parseNum(col('compare_at_price') || col('compare_price')) || undefined
      : undefined,
    stock: parseNum(col('stock') || col('inventory') || col('qty') || col('quantity') || '0'),
    category: col('category') || col('type') || 'General',
    vendor: col('vendor') || col('brand') || undefined,
    productType: col('product_type') || undefined,
    sku: col('sku') || col('barcode') || undefined,
    image: imgStr,
    images: allImages,
    tags: col('tags') ? col('tags').split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    active,
    metaTitle: col('meta_title') || col('seo_title') || undefined,
    metaDescription: col('meta_desc') || col('meta_description') || col('seo_description') || undefined,
    urduDescription: col('urdu_description') || undefined,
    tiktokCaption: col('tiktok_caption') || undefined,
    whatsappText: col('whatsapp_text') || undefined,
    weight: col('weight') ? parseNum(col('weight')) : undefined,
    requiresShipping,
  };
}
