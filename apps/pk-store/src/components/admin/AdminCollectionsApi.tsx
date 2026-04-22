import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '../../config';

type Collection = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
};

export function AdminCollectionsApi({ token }: { token: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);

  async function loadCollections() {
    const resp = await fetch(`${API_URL}/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    if (resp.ok) setCollections(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadCollections();
  }, []);

  function resetForm() {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('');
    setActive(true);
  }

  function startCreate() {
    resetForm();
  }

  function startEdit(c: Collection) {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description ?? '');
    setImage(c.image ?? '');
    setActive(c.active !== false);
  }

  async function save() {
    const payload = {
      name,
      slug,
      description: description || undefined,
      image: image || undefined,
      active,
      sortOrder: 0,
    };
    if (editing) {
      await fetch(`${API_URL}/collections/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    }
    await loadCollections();
    resetForm();
  }

  async function remove(id: number) {
    await fetch(`${API_URL}/collections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadCollections();
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#111118] border border-gray-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{editing ? 'Edit Collection' : 'Create Collection'}</h3>
          <button onClick={startCreate} className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-purple-600 px-3 py-2 rounded-xl text-xs font-bold">
            <Plus size={12} /> New
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="collection-slug" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm" />
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="bg-[#0d0d1a] border border-gray-800 rounded-xl px-3 py-2 text-sm sm:col-span-2 resize-none" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>
        <button onClick={save} className="bg-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">Save Collection</button>
      </div>

      <div className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/60">
                <td className="px-3 py-2">{c.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-400">{c.slug}</td>
                <td className="px-3 py-2">{c.active === false ? 'Hidden' : 'Active'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(c)} className="p-1.5 bg-blue-900/40 rounded-lg"><Pencil size={12} /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 bg-rose-900/40 rounded-lg"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
