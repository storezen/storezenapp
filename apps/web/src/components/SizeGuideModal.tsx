import { useEffect } from 'react';
import { X, Ruler } from 'lucide-react';

// ─── Size chart data — easy to update measurements ────────────────────────────
export const SIZE_CHART = [
  { size: 'S',   chest: '36–38', length: '27', shoulder: '16.5' },
  { size: 'M',   chest: '38–40', length: '28', shoulder: '17.5' },
  { size: 'L',   chest: '40–42', length: '29', shoulder: '18.5' },
  { size: 'XL',  chest: '42–44', length: '30', shoulder: '19.5' },
  { size: '2XL', chest: '44–46', length: '31', shoulder: '20.5' },
  { size: '3XL', chest: '46–48', length: '32', shoulder: '21.5' },
];

const HOW_TO_MEASURE = [
  {
    label: 'Chest',
    tip: 'Measure around the fullest part of your chest, keeping the tape parallel to the floor.',
  },
  {
    label: 'Length',
    tip: 'Measure from the highest point of the shoulder straight down to the hem.',
  },
  {
    label: 'Shoulder',
    tip: 'Measure from one shoulder seam to the other across the back.',
  },
];

// ─── Props ─────────────────────────────────────────────────────────────────────
interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function SizeGuideModal({ open, onClose }: SizeGuideModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom-sheet on mobile, centered dialog on desktop */}
      <div
        className={[
          'fixed z-50 bg-card text-card-foreground shadow-2xl',
          // Mobile: full-width bottom sheet, slides up
          'inset-x-0 bottom-0 rounded-t-2xl max-h-[88dvh] overflow-y-auto',
          // Desktop: centered, rounded, constrained width
          'md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          'md:rounded-2xl md:w-full md:max-w-xl md:max-h-[82vh]',
          // Animation: slide up from bottom
          'animate-size-guide-in',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Size Guide"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Ruler size={15} />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight">Size Guide</h2>
              <p className="text-[11px] text-muted-foreground">All measurements in inches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close size guide"
            data-testid="button-size-guide-close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* ── Size Chart Table ─────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Size Chart
            </h3>
            <div className="rounded-xl overflow-hidden border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-3 font-black text-xs uppercase tracking-wider">Size</th>
                    <th className="text-center px-3 py-3 font-black text-xs uppercase tracking-wider">Chest</th>
                    <th className="text-center px-3 py-3 font-black text-xs uppercase tracking-wider">Length</th>
                    <th className="text-center px-3 py-3 font-black text-xs uppercase tracking-wider">Shoulder</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((row, i) => (
                    <tr
                      key={row.size}
                      className={`border-t border-border transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-9 h-7 bg-primary/10 text-primary text-xs font-black rounded-md">
                          {row.size}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 text-muted-foreground font-medium">{row.chest}"</td>
                      <td className="text-center px-3 py-3 text-muted-foreground font-medium">{row.length}"</td>
                      <td className="text-center px-3 py-3 text-muted-foreground font-medium">{row.shoulder}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Measurements may vary by ± 0.5". When in doubt, size up.
            </p>
          </div>

          {/* ── How to Measure ───────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              How to Measure
            </h3>
            <div className="space-y-3">
              {HOW_TO_MEASURE.map(({ label, tip }) => (
                <div key={label} className="flex gap-3 bg-muted/40 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-black flex-shrink-0 mt-0.5">
                    {label[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight mb-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pro tip ──────────────────────────────────────────────────── */}
          <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <span className="text-lg leading-none mt-0.5">💡</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Pro tip:</strong> Measure a well-fitting shirt you already own and compare with the chart above for the most accurate size selection.
            </p>
          </div>

          {/* bottom padding for mobile safe area */}
          <div className="h-2 md:hidden" />
        </div>
      </div>
    </>
  );
}
