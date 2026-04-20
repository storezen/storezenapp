import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListCollections, useCreateCollection, useUpdateCollection, useDeleteCollection,
  useImportProducts, useGetCollectionProducts,
  getListCollectionsQueryKey, getListProductsQueryKey, getGetCollectionProductsQueryKey,
} from '@workspace/api-client-react';
import type { Collection, CreateCollectionInput } from '@workspace/api-client-react';
import {
  FolderOpen, Plus, Pencil, Trash2, Check, X, Upload, ChevronDown, ChevronRight,
  Package, Loader2, AlertCircle, RefreshCw, Image as ImageIcon,
} from 'lucide-react';

/* ── helpers ────────────────────────────────────────────────────────────── */
const GRAD = 'bg-gradient-to-r from-rose-500 to-purple-600';

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      active ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50'
              : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Hidden'}
    </span>
  );
}

/* ── CSV Import Modal ────────────────────────────────────────────────────── */
function CsvImportModal({
  collectionId,
  collectionName,
  onClose,
}: { collectionId?: number; collectionName?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState('');
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState<{ imported: number; updated: number; errors: string[] } | null>(null);

  const { mutate, isPending } = useImportProducts({
    mutation: {
      onSuccess: (data) => {
        setResult({ imported: data.imported, updated: data.updated, errors: data.errors });
        qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
        if (collectionId) qc.invalidateQueries({ queryKey: getGetCollectionProductsQueryKey(collectionId) });
      },
    },
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setCsv(String(ev.target?.result ?? ''));
    reader.readAsText(f);
  }

  function handleImport() {
    if (!csv.trim()) return;
    mutate({ data: { csv, collectionId, replaceExisting: replace } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111118] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Upload size={16} className="text-rose-400" /> CSV Import
            </h3>
            {collectionName && <p className="text-gray-500 text-xs mt-0.5">Into: {collectionName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Upload CSV File</label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-700 rounded-xl py-6 cursor-pointer hover:border-rose-500/50 transition-colors">
                  <Upload size={20} className="text-gray-500" />
                  <span className="text-gray-500 text-sm">Click to upload .csv</span>
                  <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
                </label>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wider">Or Paste CSV</label>
                <textarea
                  rows={6}
                  value={csv}
                  onChange={e => setCsv(e.target.value)}
                  className="w-full bg-[#0d0d1a] border border-gray-800 rounded-xl p-3 text-white text-xs font-mono placeholder-gray-700 outline-none focus:border-rose-500/50 resize-none"
                  placeholder="Handle,Title,Body (HTML),Type,Tags,Variant Price,Variant Compare At Price,Variant Inventory Qty,Image Src,Published&#10;..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setReplace(r => !r)}
                  className={`w-9 h-5 rounded-full transition-colors ${replace ? 'bg-rose-500' : 'bg-gray-700'} flex items-center px-0.5`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${replace ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-gray-400 text-xs">Replace existing products with same ID</span>
              </label>

              <div className="pt-2">
                <p className="text-gray-600 text-xs mb-3">
                  Supported: Shopify CSV export format or SmartWear simple format (id, name, price, category, image, stock, tags).
                </p>
                <button
                  onClick={handleImport}
                  disabled={!csv.trim() || isPending}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-opacity
                    ${csv.trim() && !isPending ? `${GRAD} text-white` : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                >
                  {isPending ? <><Loader2 size={15} className="animate-spin" /> Importing…</> : <><Upload size={15} /> Import Products</>}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 text-3xl font-black">{result.imported}</p>
                  <p className="text-emerald-600 text-xs mt-1">New Products</p>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-center">
                  <p className="text-blue-400 text-3xl font-black">{result.updated}</p>
                  <p className="text-blue-600 text-xs mt-1">Updated</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-rose-900/20 border border-rose-800/40 rounded-xl p-3">
                  <p className="text-rose-400 text-xs font-bold mb-2">⚠️ {result.errors.length} Warning{result.errors.length > 1 ? 's' : ''}</p>
                  <ul className="space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-rose-300 text-[11px]">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setCsv(''); setResult(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                >
                  Import More
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 py-2.5 rounded-xl ${GRAD} text-white text-sm font-bold`}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Collection Form ──────────────────────────────────────────────────────── */
function CollectionForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<CreateCollectionInput>;
  onSave: (data: CreateCollectionInput) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [desc, setDesc] = useState(initial?.description ?? '');
  const [image, setImage] = useState(initial?.image ?? '');
  const [active, setActive] = useState(initial?.active !== false);

  function autoSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function handleNameChange(v: string) {
    setName(v);
    if (!initial?.slug) setSlug(autoSlug(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    onSave({ name, slug, description: desc || undefined, image: image || undefined, active, sortOrder: initial?.sortOrder ?? 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Collection Name *</label>
          <input
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Summer Sale"
            className="w-full bg-[#0d0d1a] border border-gray-800 focus:border-rose-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Slug (URL) *</label>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            required
            placeholder="summer-sale"
            className="w-full bg-[#0d0d1a] border border-gray-800 focus:border-rose-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">Description</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={2}
          placeholder="Brief collection description…"
          className="w-full bg-[#0d0d1a] border border-gray-800 focus:border-rose-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-gray-400 text-xs font-semibold mb-1.5 uppercase tracking-wider">
          <ImageIcon size={11} className="inline mr-1" /> Cover Image URL
        </label>
        <input
          value={image}
          onChange={e => setImage(e.target.value)}
          placeholder="https://…"
          type="url"
          className="w-full bg-[#0d0d1a] border border-gray-800 focus:border-rose-500/60 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => setActive(a => !a)}
          className={`w-9 h-5 rounded-full transition-colors ${active ? 'bg-rose-500' : 'bg-gray-700'} flex items-center px-0.5`}
        >
          <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-4' : ''}`} />
        </div>
        <span className="text-gray-400 text-sm">Collection Active (visible on store)</span>
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name || !slug}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-opacity
            ${!loading && name && slug ? `${GRAD} text-white` : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Save Collection</>}
        </button>
      </div>
    </form>
  );
}

/* ── Collection Row ───────────────────────────────────────────────────────── */
function CollectionRow({
  col,
  onEdit,
  onDelete,
  onImport,
}: {
  col: Collection;
  onEdit: () => void;
  onDelete: () => void;
  onImport: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: products, isLoading } = useGetCollectionProducts(col.id, { query: { enabled: expanded } });

  return (
    <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {col.image ? (
          <img src={col.image} alt={col.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-800" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
            <FolderOpen size={20} className="text-gray-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-sm">{col.name}</span>
            <Badge active={col.active} />
          </div>
          <p className="text-gray-500 text-xs mt-0.5 font-mono">/collections/{col.slug}</p>
          {col.description && <p className="text-gray-600 text-xs mt-0.5 truncate">{col.description}</p>}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Package size={11} /> Products
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          <button
            onClick={onImport}
            className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50 px-2.5 py-1.5 rounded-lg transition-colors"
            title="Import CSV"
          >
            <Upload size={11} /> Import
          </button>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="text-rose-400 bg-rose-900/30 hover:bg-rose-900/50 p-1.5 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-800 bg-[#0d0d1a] p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> Loading products…
            </div>
          ) : products && products.length > 0 ? (
            <div className="space-y-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{products.length} product{products.length !== 1 ? 's' : ''}</p>
              <div className="grid gap-2">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-[#111118] rounded-xl p-2.5">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-800" onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=SW'; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-gray-500 text-xs">Rs. {p.price.toLocaleString()} · {p.category}</p>
                    </div>
                    <span className={`text-xs font-bold ${p.active ? 'text-emerald-400' : 'text-gray-600'}`}>{p.active ? 'Live' : 'Hidden'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Package size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No products yet</p>
              <button
                onClick={onImport}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload size={11} /> Import via CSV
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export function AdminCollections() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editTarget, setEditTarget] = useState<Collection | null>(null);
  const [importFor, setImportFor] = useState<{ id?: number; name?: string } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: collections, isLoading, refetch } = useListCollections();

  const { mutate: createMutation, isPending: creating } = useCreateCollection({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() }); setMode('list'); setError(null); },
      onError: (e) => setError((e as Error).message),
    },
  });

  const { mutate: updateMutation, isPending: updating } = useUpdateCollection({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() }); setMode('list'); setEditTarget(null); setError(null); },
      onError: (e) => setError((e as Error).message),
    },
  });

  const { mutate: deleteMutation } = useDeleteCollection({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() }); setDeleteId(null); },
    },
  });

  function handleSave(data: CreateCollectionInput) {
    if (mode === 'edit' && editTarget) {
      updateMutation({ id: editTarget.id, data });
    } else {
      createMutation({ data });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl flex items-center gap-2">
            <FolderOpen size={20} className="text-rose-400" /> Collections
          </h2>
          <p className="text-gray-500 text-xs mt-1">Group products into browsable categories — Shopify-style</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => { setMode('create'); setEditTarget(null); setError(null); }}
            className={`flex items-center gap-1.5 ${GRAD} text-white text-sm font-bold px-4 py-2 rounded-xl`}
          >
            <Plus size={15} /> New Collection
          </button>
          <button
            onClick={() => setImportFor({})}
            className="flex items-center gap-1.5 text-sm font-bold bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 px-4 py-2 rounded-xl transition-colors"
          >
            <Upload size={15} /> Import CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-900/20 border border-rose-800/40 rounded-xl p-3">
          <AlertCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-rose-300 text-sm">{error}</p>
        </div>
      )}

      {/* Create / Edit form */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5">
            <h3 className="text-white font-bold text-base">{mode === 'edit' ? `Edit: ${editTarget?.name}` : 'New Collection'}</h3>
          </div>
          <CollectionForm
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onCancel={() => { setMode('list'); setEditTarget(null); setError(null); }}
            loading={creating || updating}
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-rose-400" />
        </div>
      ) : collections && collections.length > 0 ? (
        <div className="space-y-3">
          {collections.map(col => (
            <CollectionRow
              key={col.id}
              col={col}
              onEdit={() => { setEditTarget(col); setMode('edit'); setError(null); }}
              onDelete={() => setDeleteId(col.id)}
              onImport={() => setImportFor({ id: col.id, name: col.name })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
          <FolderOpen size={40} className="text-gray-700 mx-auto mb-3" />
          <h3 className="text-gray-400 font-bold text-lg mb-1">Koi collection nahi hai abhi</h3>
          <p className="text-gray-600 text-sm mb-4">Collections banayein products ko organize karne ke liye</p>
          <button
            onClick={() => setMode('create')}
            className={`inline-flex items-center gap-2 ${GRAD} text-white font-bold px-5 py-2.5 rounded-xl text-sm`}
          >
            <Plus size={15} /> Pehli Collection Banayein
          </button>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111118] border border-gray-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Delete Collection?</h3>
              <p className="text-gray-500 text-sm mt-1">Products will NOT be deleted — only the collection link is removed.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">Cancel</button>
              <button
                onClick={() => deleteMutation({ id: deleteId })}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import modal */}
      {importFor !== null && (
        <CsvImportModal
          collectionId={importFor.id}
          collectionName={importFor.name}
          onClose={() => { setImportFor(null); qc.invalidateQueries({ queryKey: getListCollectionsQueryKey() }); }}
        />
      )}
    </div>
  );
}
