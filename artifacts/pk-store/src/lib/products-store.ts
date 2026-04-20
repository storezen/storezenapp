import { products as defaultProducts, type Product } from '../data/products';

const PRODUCTS_KEY = 'sw_products';
const UPDATE_EVENT = 'sw-products-updated';

export type { Product };

/* ── Read ────────────────────────────────────────────────────────────── */
export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch { /* ignore */ }
  return defaultProducts;
}

/* ── Write ───────────────────────────────────────────────────────────── */
export function saveProducts(list: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch { /* ignore */ }
}

export function addProduct(p: Product): void {
  const all = getProducts();
  all.unshift(p);
  saveProducts(all);
}

export function updateProduct(p: Product): void {
  const all = getProducts();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) { all[idx] = p; } else { all.unshift(p); }
  saveProducts(all);
}

export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter(p => p.id !== id));
}

export function importProducts(incoming: Product[]): void {
  const all = getProducts();
  incoming.forEach(p => {
    const idx = all.findIndex(x => x.id === p.id);
    if (idx >= 0) { all[idx] = p; } else { all.push(p); }
  });
  saveProducts(all);
}

export function resetToDefaults(): void {
  localStorage.removeItem(PRODUCTS_KEY);
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

/* ── Shopify CSV Export ───────────────────────────────────────────────── */
export function exportProductsCSV(): void {
  const header = [
    'Handle','Title','Body (HTML)','Vendor','Type','Published',
    'Option1 Name','Option1 Value','Option2 Name','Option2 Value',
    'Variant Price','Variant Compare At Price','Variant Inventory Qty',
    'Image Src','Image Position',
  ];

  const rows: string[][] = [];

  getProducts().forEach(p => {
    const handle   = p.id;
    const vendor   = 'SmartWear';
    const published = (p.status ?? 'active') === 'active' ? 'TRUE' : 'FALSE';
    const hasVariants = p.variants?.sizes || p.variants?.colors || p.variants?.options;

    if (!hasVariants) {
      rows.push([
        handle, p.name, p.description, vendor, p.category, published,
        '', '', '', '',
        String(p.price), String(p.compareAtPrice ?? ''),
        String(p.stock ?? 0),
        p.image, '1',
      ]);
      return;
    }

    const sizes   = p.variants?.sizes   ?? [];
    const colors  = p.variants?.colors  ?? [];
    const options = p.variants?.options ?? [];

    if (options.length) {
      options.forEach((opt, i) => {
        rows.push([
          handle, i === 0 ? p.name : '', i === 0 ? p.description : '', vendor, p.category, published,
          'Format', opt.name, '', '',
          String(opt.price), String(p.compareAtPrice ?? ''),
          String(p.stock ?? 0),
          i === 0 ? p.image : '', i === 0 ? '1' : '',
        ]);
      });
      return;
    }

    const combos: { size?: string; color?: string }[] = [];
    if (sizes.length && colors.length) {
      sizes.forEach(s => colors.forEach(c => combos.push({ size: s, color: c })));
    } else if (sizes.length) {
      sizes.forEach(s => combos.push({ size: s }));
    } else {
      colors.forEach(c => combos.push({ color: c }));
    }

    combos.forEach((combo, i) => {
      rows.push([
        handle, i === 0 ? p.name : '', i === 0 ? p.description : '', vendor, p.category, published,
        sizes.length ? 'Size' : '', combo.size ?? combo.color ?? '',
        colors.length && sizes.length ? 'Color' : '', colors.length && sizes.length ? (combo.color ?? '') : '',
        String(p.price), String(p.compareAtPrice ?? ''),
        String(p.stock ?? 0),
        i === 0 ? p.image : '', i === 0 ? '1' : '',
      ]);
    });
  });

  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `smartwear-products-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Shopify CSV Import Parser ───────────────────────────────────────── */
export function parseShopifyCSV(text: string): Product[] {
  const lines  = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuotes) { inQuotes = true; continue; }
      if (ch === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; continue; }
      if (ch === '"' && inQuotes) { inQuotes = false; continue; }
      if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += ch;
    }
    result.push(current);
    return result;
  };

  const header = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  const col = (row: string[], name: string) => {
    const idx = header.indexOf(name.toLowerCase());
    return idx >= 0 ? (row[idx] ?? '').trim() : '';
  };

  const productMap = new Map<string, {
    handle: string; title: string; desc: string; category: string;
    published: boolean; price: number; compareAt: number;
    imageSrc: string; stock: number;
    opt1Name: string; opt1Values: string[];
    opt2Name: string; opt2Values: string[];
  }>();

  for (let i = 1; i < lines.length; i++) {
    const row    = parseLine(lines[i]);
    const handle = col(row, 'handle') || col(row, 'handle (product url)');
    if (!handle) continue;

    const title   = col(row, 'title');
    const price   = parseFloat(col(row, 'variant price') || col(row, 'price')) || 0;
    const compareAt = parseFloat(col(row, 'variant compare at price') || col(row, 'compare at price') || col(row, 'compare-at price')) || 0;
    const stock   = parseInt(col(row, 'variant inventory qty') || col(row, 'inventory quantity') || '0', 10) || 0;
    const imageSrc = col(row, 'image src');
    const opt1Name = col(row, 'option1 name');
    const opt1Val  = col(row, 'option1 value');
    const opt2Name = col(row, 'option2 name');
    const opt2Val  = col(row, 'option2 value');
    const pub      = col(row, 'published').toUpperCase() !== 'FALSE';

    if (!productMap.has(handle)) {
      productMap.set(handle, {
        handle, title: title || handle, desc: col(row, 'body (html)') || col(row, 'description') || '',
        category: col(row, 'type') || col(row, 'product type') || 'Clothing',
        published: pub, price, compareAt, imageSrc, stock,
        opt1Name, opt1Values: [], opt2Name, opt2Values: [],
      });
    }

    const p = productMap.get(handle)!;
    if (title && !p.title) p.title = title;
    if (imageSrc && !p.imageSrc) p.imageSrc = imageSrc;
    if (price && !p.price) p.price = price;
    if (opt1Val && !p.opt1Values.includes(opt1Val)) p.opt1Values.push(opt1Val);
    if (opt2Val && !p.opt2Values.includes(opt2Val)) p.opt2Values.push(opt2Val);
  }

  return Array.from(productMap.values()).map(p => {
    const product: Product = {
      id: p.handle,
      name: p.title,
      description: p.desc,
      category: p.category,
      image: p.imageSrc || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      images: p.imageSrc ? [p.imageSrc] : [],
      price: p.price,
      stock: p.stock,
      status: p.published ? 'active' : 'draft',
    };
    if (p.compareAt) product.compareAtPrice = p.compareAt;

    const sizes  = p.opt1Name.toLowerCase().includes('size')  ? p.opt1Values : p.opt2Name.toLowerCase().includes('size')  ? p.opt2Values : [];
    const colors = p.opt1Name.toLowerCase().includes('color') ? p.opt1Values : p.opt2Name.toLowerCase().includes('color') ? p.opt2Values : [];
    const format = p.opt1Name.toLowerCase().includes('format') || p.opt1Name.toLowerCase().includes('type')
      ? p.opt1Values.map(v => ({ name: v, price: p.price })) : [];

    if (format.length) { product.variants = { options: format }; }
    else if (sizes.length || colors.length) {
      product.variants = {};
      if (sizes.length)  product.variants.sizes  = sizes;
      if (colors.length) product.variants.colors = colors;
    }

    return product;
  });
}

export const UPDATE_EVENT_NAME = UPDATE_EVENT;
