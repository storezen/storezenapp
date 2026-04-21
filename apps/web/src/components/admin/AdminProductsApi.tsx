import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../hooks/use-toast';

type ProductRow = {
  id: string;
  name: string;
  category?: string | null;
  price: string | number;
  salePrice?: string | number | null;
  stock?: number | null;
  description?: string | null;
  isActive?: boolean;
  variants?: Record<string, unknown> | null;
  urduDescription?: string | null;
  tiktokCaption?: string | null;
  whatsappText?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
};

type FormState = {
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  description?: string;
  urduDescription?: string;
  tiktokCaption?: string;
  whatsappText?: string;
  metaTitle?: string;
  metaDesc?: string;
};

const emptyForm: FormState = { name: '', category: 'Clothing', price: 0, stock: 0 };

export function AdminProductsApi({ token }: { token: string }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } else {
        toast({ title: 'Load failed', description: String(data?.error ?? 'Could not load products'), variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const hasAiContent = useMemo(
    () =>
      Boolean(
        (form.urduDescription ?? '').trim() ||
          (form.tiktokCaption ?? '').trim() ||
          (form.whatsappText ?? '').trim() ||
          (form.metaTitle ?? '').trim() ||
          (form.metaDesc ?? '').trim(),
      ),
    [form],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowAiPanel(false);
  }

  function openEdit(p: ProductRow) {
    const rawAi = (p.variants && typeof p.variants === 'object' ? (p.variants as Record<string, unknown>).aiContent : undefined) as
      | Record<string, unknown>
      | undefined;
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category ?? 'General',
      price: Number(p.price ?? 0),
      salePrice: p.salePrice != null ? Number(p.salePrice) : undefined,
      stock: Number(p.stock ?? 0),
      description: p.description ?? '',
      urduDescription: p.urduDescription ?? (typeof rawAi?.urduDescription === 'string' ? rawAi.urduDescription : ''),
      tiktokCaption: p.tiktokCaption ?? (typeof rawAi?.tiktokCaption === 'string' ? rawAi.tiktokCaption : ''),
      whatsappText: p.whatsappText ?? (typeof rawAi?.whatsappText === 'string' ? rawAi.whatsappText : ''),
      metaTitle: p.metaTitle ?? (typeof rawAi?.metaTitle === 'string' ? rawAi.metaTitle : ''),
      metaDesc: p.metaDesc ?? (typeof rawAi?.metaDesc === 'string' ? rawAi.metaDesc : ''),
    });
  }

  async function save() {
    const body = {
      name: form.name,
      category: form.category,
      price: form.price,
      salePrice: form.salePrice,
      stock: form.stock,
      description: form.description,
      urduDescription: form.urduDescription,
      tiktokCaption: form.tiktokCaption,
      whatsappText: form.whatsappText,
      metaTitle: form.metaTitle,
      metaDesc: form.metaDesc,
      images: ['https://placehold.co/300x300?text=Product'],
      variants: {
        aiContent: {
          urduDescription: form.urduDescription ?? '',
          tiktokCaption: form.tiktokCaption ?? '',
          whatsappText: form.whatsappText ?? '',
          metaTitle: form.metaTitle ?? '',
          metaDesc: form.metaDesc ?? '',
        },
      },
      isActive: true,
    };
    const url = editing ? `${API_URL}/products/${editing.id}` : `${API_URL}/products`;
    const method = editing ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast({ title: 'Save failed', description: String(data?.error ?? 'Could not save product'), variant: 'destructive' });
      return;
    }
    await loadProducts();
    openCreate();
    toast({ title: editing ? 'Product updated' : 'Product created', description: 'Changes saved successfully.' });
  }

  async function generateWithAi() {
    if (!form.name.trim() || !form.category.trim()) return;
    setAiLoading(true);
    try {
      const resp = await fetch(`${API_URL}/ai/generate-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          features: [form.description ?? ''],
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast({ title: 'AI generation failed', description: String(data?.error ?? 'Could not generate content'), variant: 'destructive' });
        return;
      }
      setForm((prev) => ({
        ...prev,
        description: String(data.description ?? prev.description ?? ''),
        urduDescription: String(data.urdu_description ?? ''),
        tiktokCaption: String(data.tiktok_caption ?? ''),
        whatsappText: String(data.whatsapp_text ?? ''),
        metaTitle: String(data.meta_title ?? ''),
        metaDesc: String(data.meta_desc ?? ''),
      }));
      setShowAiPanel(true);
      toast({ title: 'AI content generated', description: 'Product copy has been filled in the form.' });
    } finally {
      setAiLoading(false);
    }
  }

  async function remove(id: string) {
    const resp = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      toast({ title: 'Delete failed', description: String(data?.error ?? 'Could not delete product'), variant: 'destructive' });
      return;
    }
    await loadProducts();
    toast({ title: 'Product deleted', description: 'Product removed successfully.' });
  }

  async function downloadTemplate() {
    setTemplateLoading(true);
    try {
      const resp = await fetch(`${API_URL}/products/template`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        toast({ title: 'Template download failed', description: String(data?.error ?? 'Could not download template'), variant: 'destructive' });
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Template downloaded', description: 'products-template.csv downloaded.' });
    } finally {
      setTemplateLoading(false);
    }
  }

  async function exportCsv() {
    setExportLoading(true);
    try {
      const resp = await fetch(`${API_URL}/products/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        toast({ title: 'Export failed', description: String(data?.error ?? 'Could not export products'), variant: 'destructive' });
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: 'products.csv downloaded.' });
    } finally {
      setExportLoading(false);
    }
  }

  async function importCsv(file: File) {
    setImportLoading(true);
    try {
      const csv = await file.text();
      const resp = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ csv, replaceExisting: true }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast({ title: 'Import failed', description: String(data?.error ?? 'Could not import CSV'), variant: 'destructive' });
        return;
      }
      await loadProducts();
      toast({
        title: 'Import complete',
        description: `Imported: ${Number(data?.imported ?? 0)}, Updated: ${Number(data?.updated ?? 0)}`,
      });
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 rounded-xl text-sm font-bold">
          <Plus size={14} /> Add Product
        </button>
        <button
          onClick={downloadTemplate}
          disabled={templateLoading}
          className="bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {templateLoading ? 'Downloading...' : 'Download Template'}
        </button>
        <button
          onClick={exportCsv}
          disabled={exportLoading}
          className="bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
        >
          {exportLoading ? 'Exporting...' : 'Export CSV'}
        </button>
        <label className="bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer">
          {importLoading ? 'Importing...' : 'Import CSV'}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={importLoading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products"
          className="flex-1 bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-sm">{editing ? 'Edit Product' : 'Create Product'}</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Name" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} placeholder="Category" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))} placeholder="Price" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input type="number" value={form.stock} onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))} placeholder="Stock" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <textarea value={form.description ?? ''} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} placeholder="Description" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2 resize-none" rows={3} />
        </div>
        <div className="flex gap-2">
          <button onClick={generateWithAi} disabled={aiLoading} className="bg-violet-700 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">
            {aiLoading ? 'Generating...' : 'Generate with AI'}
          </button>
          <button
            onClick={() => setShowAiPanel((s) => !s)}
            className="bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold"
          >
            {showAiPanel ? 'Hide AI Fields' : 'Show AI Fields'}
          </button>
          <button onClick={save} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save</button>
        </div>
        {(showAiPanel || hasAiContent) && (
          <div className="border border-gray-800 rounded-xl p-3 space-y-2 bg-[#0d0d1a]">
            <p className="text-xs text-gray-400">AI Generated Content</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input value={form.metaTitle ?? ''} onChange={(e) => setForm((s) => ({ ...s, metaTitle: e.target.value }))} placeholder="Meta Title" className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
              <input value={form.metaDesc ?? ''} onChange={(e) => setForm((s) => ({ ...s, metaDesc: e.target.value }))} placeholder="Meta Description" className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
              <textarea value={form.urduDescription ?? ''} onChange={(e) => setForm((s) => ({ ...s, urduDescription: e.target.value }))} placeholder="Urdu Description" className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2 resize-none" rows={3} />
              <textarea value={form.tiktokCaption ?? ''} onChange={(e) => setForm((s) => ({ ...s, tiktokCaption: e.target.value }))} placeholder="TikTok Caption" className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2 resize-none" rows={2} />
              <textarea value={form.whatsappText ?? ''} onChange={(e) => setForm((s) => ({ ...s, whatsappText: e.target.value }))} placeholder="WhatsApp Text" className="bg-[#111118] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2 resize-none" rows={3} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={5}>Loading...</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/60">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">{p.category ?? '-'}</td>
                  <td className="px-3 py-2">Rs. {Number(p.salePrice ?? p.price ?? 0)}</td>
                  <td className="px-3 py-2">{p.stock ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 bg-blue-900/40 rounded-lg"><Pencil size={12} /></button>
                      <button onClick={() => remove(p.id)} className="p-1.5 bg-rose-900/40 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
