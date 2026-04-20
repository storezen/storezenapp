import { useState, useRef, useCallback } from 'react';
import {
  Plus, Upload, Download, Pencil, Trash2, Eye, EyeOff,
  X, Check, Package, Image as ImageIcon, AlertTriangle, FileText,
} from 'lucide-react';
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  importProducts, exportProductsCSV, parseShopifyCSV,
} from '../../lib/products-store';
import { useProducts } from '../../hooks/use-products';
import type { Product } from '../../data/products';

/* ── Helpers ─────────────────────────────────────────────────────────── */
function genId() {
  return `product-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const CATEGORIES = ['Clothing', 'Digital', 'Beauty', 'Electronics', 'Accessories', 'Other'];

/* ── Status Badge ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status?: 'active' | 'draft' }) {
  return status === 'draft'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-800 text-gray-400 border border-gray-700"><EyeOff size={10} /> Draft</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"><Eye size={10} /> Active</span>;
}

/* ── Empty product form ──────────────────────────────────────────────── */
const EMPTY_FORM = (): Partial<Product> => ({
  name: '', description: '', category: 'Clothing', price: 0,
  compareAtPrice: undefined, image: '', images: [],
  stock: 0, status: 'active',
  variants: { sizes: [], colors: [] },
});

/* ── Product Form Modal ──────────────────────────────────────────────── */
function ProductModal({
  initial, onSave, onClose,
}: { initial?: Product; onSave: (p: Product) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Product>>(initial ? { ...initial } : EMPTY_FORM());
  const [sizesRaw,  setSizesRaw]  = useState((initial?.variants?.sizes  ?? []).join(', '));
  const [colorsRaw, setColorsRaw] = useState((initial?.variants?.colors ?? []).join(', '));
  const [imagesRaw, setImagesRaw] = useState((initial?.images ?? []).join('\n'));
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.name?.trim()) { setError('Product name zaroori hai'); return; }
    if (!form.price || form.price <= 0) { setError('Valid price daalo'); return; }
    if (!form.image?.trim() && !imagesRaw.trim()) { setError('Kam az kam ek image URL daalo'); return; }

    const imageList = imagesRaw.split('\n').map(s => s.trim()).filter(Boolean);
    const primaryImage = form.image?.trim() || imageList[0] || '';

    const sizes  = sizesRaw.split(',').map(s => s.trim()).filter(Boolean);
    const colors = colorsRaw.split(',').map(s => s.trim()).filter(Boolean);

    const product: Product = {
      id: initial?.id ?? genId(),
      name: form.name!.trim(),
      description: form.description ?? '',
      category: form.category ?? 'Clothing',
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      image: primaryImage,
      images: imageList.length ? imageList : [primaryImage],
      stock: Number(form.stock ?? 0),
      status: form.status ?? 'active',
    };

    if (sizes.length || colors.length) {
      product.variants = {};
      if (sizes.length)  product.variants.sizes  = sizes;
      if (colors.length) product.variants.colors = colors;
    }

    onSave(product);
  }

  const field = (label: string, el: React.ReactNode) => (
    <div>
      <label className="text-gray-500 text-xs font-medium uppercase tracking-wider block mb-1">{label}</label>
      {el}
    </div>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none focus:border-rose-500/50 transition-colors"
    />
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111118] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-[#111118] z-10">
          <h2 className="font-black text-white">{initial ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-900/30 border border-rose-700/50 text-rose-300 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Product Name *', input({ placeholder: 'e.g. Premium T-Shirt', value: form.name ?? '', onChange: e => setForm(f => ({ ...f, name: e.target.value })) }))}
            {field('Category', (
              <select
                value={form.category ?? 'Clothing'}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rose-500/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ))}
          </div>

          {field('Description', (
            <textarea
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Product description..."
              className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none focus:border-rose-500/50 resize-none transition-colors"
            />
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field('Price (Rs.) *', input({ type: 'number', min: 0, placeholder: '999', value: form.price || '', onChange: e => setForm(f => ({ ...f, price: +e.target.value })) }))}
            {field('Sale/Compare-at Price', input({ type: 'number', min: 0, placeholder: '1499', value: form.compareAtPrice || '', onChange: e => setForm(f => ({ ...f, compareAtPrice: +e.target.value || undefined })) }))}
            {field('Stock Qty', input({ type: 'number', min: 0, placeholder: '50', value: form.stock ?? 0, onChange: e => setForm(f => ({ ...f, stock: +e.target.value })) }))}
          </div>

          {field('Main Image URL *', input({ type: 'url', placeholder: 'https://...', value: form.image ?? '', onChange: e => setForm(f => ({ ...f, image: e.target.value })) }))}

          {form.image && (
            <div className="flex items-center gap-3">
              <img src={form.image} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-800" onError={e => (e.currentTarget.style.display = 'none')} />
              <p className="text-gray-600 text-xs">Image preview</p>
            </div>
          )}

          {field('Additional Images (one URL per line)', (
            <textarea
              value={imagesRaw}
              onChange={e => setImagesRaw(e.target.value)}
              rows={3}
              placeholder={'https://example.com/img1.jpg\nhttps://example.com/img2.jpg'}
              className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-700 outline-none focus:border-rose-500/50 resize-none font-mono transition-colors"
            />
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Sizes (comma-separated)', input({ placeholder: 'S, M, L, XL', value: sizesRaw, onChange: e => setSizesRaw(e.target.value) }))}
            {field('Colors (comma-separated)', input({ placeholder: 'Black, White, Red', value: colorsRaw, onChange: e => setColorsRaw(e.target.value) }))}
          </div>

          {field('Status', (
            <div className="flex gap-3">
              {(['active', 'draft'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors capitalize
                    ${form.status === s
                      ? s === 'active'
                        ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                      : 'border-gray-800 text-gray-600 hover:border-gray-700'
                    }`}
                >
                  {s === 'active' ? '✅ Active' : '👁️ Draft'}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            data-testid="button-save-product"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black text-sm hover:opacity-90 transition-opacity"
          >
            {initial ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirmation ─────────────────────────────────────────────── */
function DeleteConfirm({ product, onConfirm, onClose }: { product: Product; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111118] border border-gray-800 rounded-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-rose-400" />
        </div>
        <h3 className="text-white font-black text-lg mb-2">Delete Product?</h3>
        <p className="text-gray-500 text-sm mb-6">
          <span className="text-white font-semibold">"{product.name}"</span> permanently delete ho jaega. Ye undo nahi ho sakta.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            data-testid="button-confirm-delete"
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── CSV Import Panel ────────────────────────────────────────────────── */
function CsvImportPanel({ onClose, onImported }: { onClose: () => void; onImported: (count: number) => void }) {
  const [preview, setPreview]   = useState<Product[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError]       = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setError('Sirf .csv file upload karein'); return; }
    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseShopifyCSV(ev.target?.result as string);
        if (!parsed.length) { setError('CSV mein koi valid products nahi mile'); return; }
        setPreview(parsed);
      } catch {
        setError('CSV parse error. Shopify format mein hona chahiye.');
      }
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    if (!preview) return;
    setImporting(true);
    importProducts(preview);
    onImported(preview.length);
    setImporting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111118] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-black text-white flex items-center gap-2"><Upload size={18} className="text-rose-400" /> Import from CSV</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="bg-[#0d0d1a] border border-gray-800 rounded-xl p-4 text-sm text-gray-500 space-y-1.5">
            <p className="font-semibold text-gray-400">📋 Supported Format</p>
            <p>Shopify CSV export format: Handle, Title, Description, Vendor, Type, Published, Option1 Name, Option1 Value, Option2 Name, Option2 Value, Variant Price, Variant Compare At Price, Variant Inventory Qty, Image Src</p>
            <p className="text-gray-600 text-xs">Multi-row variants (empty Title = same product) supported.</p>
          </div>

          {/* File Upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-800 hover:border-rose-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
            data-testid="csv-upload-area"
          >
            <FileText size={32} className="mx-auto mb-3 text-gray-700 group-hover:text-rose-400 transition-colors" />
            {fileName
              ? <p className="text-white font-semibold">{fileName}</p>
              : <p className="text-gray-500">Click to choose a .csv file</p>
            }
            <p className="text-gray-700 text-xs mt-1">Shopify-compatible CSV format</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} data-testid="input-csv-file" />
          </div>

          {error && (
            <div className="bg-rose-900/30 border border-rose-700/50 text-rose-300 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Preview Table */}
          {preview && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-300 text-sm font-semibold">{preview.length} product{preview.length !== 1 ? 's' : ''} ready to import:</p>
                <span className="text-xs text-gray-600">(existing products with same ID will be updated)</span>
              </div>
              <div className="bg-[#0d0d1a] border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs" data-testid="csv-preview-table">
                    <thead className="sticky top-0 bg-[#0d0d1a]">
                      <tr className="border-b border-gray-800 text-left">
                        {['Thumbnail','Name','Category','Price','Compare-at','Stock','Status'].map(h => (
                          <th key={h} className="px-3 py-2 text-gray-600 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {preview.map(p => (
                        <tr key={p.id} className="hover:bg-gray-800/20">
                          <td className="px-3 py-2">
                            {p.image
                              ? <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                              : <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center"><ImageIcon size={12} className="text-gray-600" /></div>
                            }
                          </td>
                          <td className="px-3 py-2 text-white font-medium max-w-[150px] truncate">{p.name}</td>
                          <td className="px-3 py-2 text-gray-500">{p.category}</td>
                          <td className="px-3 py-2 text-emerald-400 font-bold">Rs. {p.price}</td>
                          <td className="px-3 py-2 text-gray-500">{p.compareAtPrice ? `Rs. ${p.compareAtPrice}` : '-'}</td>
                          <td className="px-3 py-2 text-gray-400">{p.stock ?? 0}</td>
                          <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-800 text-gray-400 hover:text-white text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!preview || importing}
            data-testid="button-confirm-import"
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {importing ? 'Importing…' : `Confirm Import (${preview?.length ?? 0})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Admin Products Main ─────────────────────────────────────────────── */
export function AdminProducts() {
  const products          = useProducts();
  const [editProduct, setEditProduct]   = useState<Product | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showImport, setShowImport]     = useState(false);
  const [toast, setToast]              = useState('');
  const [search, setSearch]            = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  function handleSave(p: Product) {
    if (editProduct === 'new') { addProduct(p); showToast(`✅ "${p.name}" add ho gaya!`); }
    else { updateProduct(p); showToast(`✅ "${p.name}" update ho gaya!`); }
    setEditProduct(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    showToast(`🗑️ "${deleteTarget.name}" delete ho gaya.`);
    setDeleteTarget(null);
  }

  function handleToggleStatus(p: Product) {
    const updated = { ...p, status: p.status === 'draft' ? 'active' as const : 'draft' as const };
    updateProduct(updated);
    showToast(`${updated.status === 'active' ? '✅ Active' : '👁️ Draft'} set kiya: "${p.name}"`);
  }

  const filtered = products.filter(p => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus || (!p.status && filterStatus === 'active');
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-gray-700 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold z-50 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setEditProduct('new')}
          data-testid="button-add-product"
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Add Product
        </button>
        <button
          onClick={() => setShowImport(true)}
          data-testid="button-import-csv"
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Upload size={15} /> Import CSV
        </button>
        <button
          onClick={exportProductsCSV}
          data-testid="button-export-products-csv"
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Download size={15} /> Export CSV
        </button>
        <span className="ml-auto text-xs text-gray-600">{filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            data-testid="input-products-search"
            className="w-full bg-[#111118] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-rose-500/50 appearance-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Package size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">{products.length === 0 ? 'Koi product nahi hai' : 'Koi result nahi'}</p>
          <button
            onClick={() => setEditProduct('new')}
            className="mt-4 text-rose-400 text-sm hover:underline"
          >
            + Pehla product add karein
          </button>
        </div>
      )}

      {/* Products Table */}
      {filtered.length > 0 && (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="products-table">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {['Image','Product','Category','Price','Compare-at','Stock','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-gray-600 font-semibold text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-800/20 transition-colors group">
                    <td className="px-4 py-3">
                      {product.image
                        ? <img src={product.image} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-gray-800" onError={e => (e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/></svg>')} />
                        : <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center"><ImageIcon size={18} className="text-gray-600" /></div>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-sm">{product.name}</p>
                      <p className="text-gray-600 text-[10px] font-mono">{product.id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{product.category}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400 whitespace-nowrap text-xs">Rs. {product.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{product.compareAtPrice ? `Rs. ${product.compareAtPrice.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${(product.stock ?? 0) < 5 ? 'text-rose-400' : (product.stock ?? 0) < 20 ? 'text-amber-400' : 'text-gray-300'}`}>
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Toggle Active/Draft */}
                        <button
                          onClick={() => handleToggleStatus(product)}
                          title={product.status === 'draft' ? 'Set Active' : 'Set Draft'}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          data-testid={`button-toggle-${product.id}`}
                        >
                          {product.status === 'draft' ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => setEditProduct(product)}
                          title="Edit"
                          className="p-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-800/50 text-blue-400 transition-colors"
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil size={13} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(product)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 transition-colors"
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {editProduct !== null && (
        <ProductModal
          initial={editProduct === 'new' ? undefined : editProduct}
          onSave={handleSave}
          onClose={() => setEditProduct(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {showImport && (
        <CsvImportPanel
          onClose={() => setShowImport(false)}
          onImported={count => showToast(`✅ ${count} product${count !== 1 ? 's' : ''} import ho gaye!`)}
        />
      )}
    </div>
  );
}
