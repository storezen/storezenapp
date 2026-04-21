import { useState, useCallback } from 'react';
import {
  MessageCircle, Copy, Check, Edit3, Save, RotateCcw, Send,
  ExternalLink, Phone, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import {
  getTemplates, saveTemplates, resetTemplates, fillTemplate,
  SAMPLE_VARS, type WaTemplate,
} from '../../lib/wa-templates';

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function openWA(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('92') ? digits : digits.startsWith('0') ? '92' + digits.slice(1) : '92' + digits;
  window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, '_blank');
}

/* ── Tag Pill ─────────────────────────────────────────────────────────────── */
const VARS = [
  '{customer_name}', '{order_id}', '{product_name}', '{total}',
  '{delivery_estimate}', '{tracking_number}', '{delivery_date}',
  '{tracking_url}', '{review_url}', '{price}', '{store_url}',
];

function VarPills() {
  const [copied, setCopied] = useState('');
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {VARS.map(v => (
        <button
          key={v}
          type="button"
          onClick={() => { copyText(v); setCopied(v); setTimeout(() => setCopied(''), 1500); }}
          className="text-[10px] font-mono bg-violet-900/40 hover:bg-violet-800/50 text-violet-300 border border-violet-700/40 px-2 py-0.5 rounded-full transition-colors"
          title="Click to copy variable"
        >
          {copied === v ? '✓ copied' : v}
        </button>
      ))}
    </div>
  );
}

/* ── Template Card ────────────────────────────────────────────────────────── */
function TemplateCard({
  template, index, onSave,
}: {
  template: WaTemplate;
  index: number;
  onSave: (index: number, newText: string) => void;
}) {
  const [editing, setEditing]     = useState(false);
  const [draft,   setDraft]       = useState(template.text);
  const [phone,   setPhone]       = useState('');
  const [copied,  setCopied]      = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const preview = fillTemplate(template.text, SAMPLE_VARS);

  function handleSave() {
    onSave(index, draft);
    setEditing(false);
  }

  function handleCancelEdit() {
    setDraft(template.text);
    setEditing(false);
  }

  function handleCopy() {
    copyText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpenWA() {
    if (!phone.trim()) { setShowPhone(true); return; }
    openWA(phone, preview);
  }

  return (
    <div
      className="bg-[#111118] border border-gray-800 rounded-2xl overflow-hidden"
      data-testid={`template-card-${template.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{template.emoji}</span>
          <div>
            <p className="text-white font-bold text-sm">{template.name}</p>
            <p className="text-gray-600 text-[10px]">Status: <span className="text-gray-500">{template.statusHint}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => { setEditing(true); setDraft(template.text); }}
              data-testid={`button-edit-${template.id}`}
              className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Edit3 size={11} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-1.5 rounded-lg transition-colors"
              >
                <X size={11} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                data-testid={`button-save-${template.id}`}
                className="flex items-center gap-1 text-xs bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Save size={11} /> Save
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className="text-gray-600 hover:text-gray-400 transition-colors"
            title={showPreview ? 'Collapse' : 'Expand'}
          >
            {showPreview ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="p-4 space-y-4">
          {/* Edit area */}
          {editing && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                Edit Template — use <span className="text-violet-400">{'{variable}'}</span> placeholders
              </label>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                data-testid={`textarea-edit-${template.id}`}
                rows={7}
                className="w-full bg-[#0d0d1a] border border-gray-700 focus:border-violet-500/60 outline-none rounded-xl px-3 py-2.5 text-sm text-gray-200 font-mono resize-none transition-colors"
              />
              <VarPills />
            </div>
          )}

          {/* Preview */}
          <div className="bg-[#0d1a12] border border-[#25D366]/20 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[#25D366]/10 border-b border-[#25D366]/20">
              <div className="flex items-center gap-2">
                <MessageCircle size={12} className="text-[#25D366]" />
                <span className="text-[11px] font-bold text-[#25D366]">Preview (sample data)</span>
              </div>
            </div>
            <pre className="px-4 py-3 text-sm text-gray-200 font-sans whitespace-pre-wrap leading-relaxed">
              {preview}
            </pre>
          </div>

          {/* Phone input (conditional) */}
          {showPhone && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Customer phone e.g. 03001234567"
                  data-testid={`input-phone-${template.id}`}
                  className="w-full bg-[#0d0d1a] border border-gray-700 focus:border-[#25D366]/50 outline-none rounded-xl pl-9 pr-3 py-2 text-sm text-white transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => { if (phone.trim()) openWA(phone, preview); }}
                className="flex items-center gap-1.5 text-xs bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] px-3 py-2 rounded-xl font-bold transition-colors whitespace-nowrap"
              >
                <ExternalLink size={12} /> Open WA
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              data-testid={`button-copy-${template.id}`}
              className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl font-bold transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <button
              type="button"
              onClick={handleOpenWA}
              data-testid={`button-wa-${template.id}`}
              className="flex items-center gap-1.5 text-xs bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] px-3 py-2 rounded-xl font-bold transition-colors"
            >
              <Send size={12} /> Open in WhatsApp
            </button>

            {showPhone && (
              <button
                type="button"
                onClick={() => setShowPhone(false)}
                className="text-xs text-gray-600 hover:text-gray-400 px-2 py-2 transition-colors"
              >
                ✕ hide
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export function AdminTemplates() {
  const [templates, setTemplates] = useState<WaTemplate[]>(() => getTemplates());
  const [resetDone, setResetDone] = useState(false);

  const handleSave = useCallback((index: number, newText: string) => {
    setTemplates(prev => {
      const next = prev.map((t, i) => i === index ? { ...t, text: newText } : t);
      saveTemplates(next);
      return next;
    });
  }, []);

  function handleReset() {
    resetTemplates();
    setTemplates(getTemplates());
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-lg flex items-center gap-2">
            <MessageCircle size={18} className="text-[#25D366]" /> WhatsApp Message Templates
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Editable templates to send order updates to customers. Customizations are saved automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          data-testid="button-reset-templates"
          className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-xl transition-colors"
        >
          <RotateCcw size={12} /> {resetDone ? 'Reset done!' : 'Reset to Defaults'}
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-violet-900/20 border border-violet-700/30 rounded-2xl px-4 py-3 flex items-start gap-3">
        <span className="text-lg leading-none flex-shrink-0">💡</span>
        <div className="text-xs text-violet-300 space-y-1">
          <p className="font-bold">How to use:</p>
          <ul className="list-disc list-inside space-y-0.5 text-violet-400">
            <li>Click <strong>Edit</strong> to customize any template text</li>
            <li>Click variable pills to copy them into your template</li>
            <li>Click <strong>Open in WhatsApp</strong> → enter customer phone → message is pre-filled</li>
            <li>From the Orders table, use <strong>Send Update</strong> to auto-fill customer data</li>
          </ul>
        </div>
      </div>

      {/* Template Cards */}
      <div className="space-y-4">
        {templates.map((t, i) => (
          <TemplateCard key={t.id} template={t} index={i} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}
