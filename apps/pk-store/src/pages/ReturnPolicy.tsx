import { useLocation } from 'wouter';
import { ArrowLeft, Package, RefreshCw, Banknote, XCircle, MessageCircle, RotateCcw } from 'lucide-react';
import { STORE_CONFIG } from '../config';
import { useSeo } from '../hooks/useSeo';
import { Navbar } from '../components/Navbar';

const SECTIONS = [
  {
    icon:  '📦',
    lucide: Package,
    title: 'Easy Returns',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10',
    items: [
      'We accept returns within **7 days** of delivery',
      'Product must be unused, unworn, and in original packaging',
      'Tags must be attached and intact',
    ],
  },
  {
    icon:  '🔄',
    lucide: RefreshCw,
    title: 'Exchange Process',
    color: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10',
    items: [
      'Contact us on WhatsApp with your **Order ID**',
      "We'll arrange a pickup from your address",
      'Choose a replacement product or get store credit',
      'Exchange delivery within **3–5 business days**',
    ],
  },
  {
    icon:  '💰',
    lucide: Banknote,
    title: 'Refund Policy',
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    items: [
      'Refunds processed within **5–7 business days** after we receive the item',
      'Refund sent to your **JazzCash / Easypaisa** or bank account',
      'Delivery charges are non-refundable',
    ],
  },
  {
    icon:  '❌',
    lucide: XCircle,
    title: 'Non-Returnable Items',
    color: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10',
    items: [
      'Digital products (eBooks, audio files)',
      'Perfumes and beauty products (hygiene reasons)',
      'Items purchased on clearance / final sale',
    ],
  },
];

function PolicyItem({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <li className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
      <span>
        {parts.map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part
        )}
      </span>
    </li>
  );
}

export default function ReturnPolicy() {
  const [, setLocation] = useLocation();

  useSeo({
    title: 'Return & Exchange Policy — Zorvik',
    description: '7-day easy returns, quick exchanges, and hassle-free refunds on all Zorvik orders.',
  });

  const whatsappHref = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hi! I need help with a return/exchange. My Order ID is: ')}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back */}
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="button-back-return-policy"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <RotateCcw size={30} className="text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Return &amp; Exchange Policy</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We want you to love every purchase. If something isn't right, we'll make it right — quickly and hassle-free.
          </p>

          {/* Quick trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {['📦 7-Day Returns', '🔄 Easy Exchanges', '💰 Refund Guaranteed'].map(badge => (
              <span
                key={badge}
                className="px-3 py-1.5 bg-muted rounded-full text-xs font-bold text-foreground/80 border border-border"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Policy sections */}
        <div className="space-y-4">
          {SECTIONS.map(section => {
            const Icon = section.lucide;
            return (
              <div
                key={section.title}
                className={`rounded-2xl border p-5 ${section.color}`}
                data-testid={`policy-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.iconBg}`}>
                    <Icon size={20} className="current" />
                  </div>
                  <h2 className="text-lg font-black">{section.icon} {section.title}</h2>
                </div>
                <ul className="space-y-2.5 pl-1">
                  {section.items.map(item => (
                    <PolicyItem key={item} text={item} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Need Help CTA */}
        <div
          className="mt-8 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-6 text-center"
          data-testid="section-need-help"
        >
          <MessageCircle className="mx-auto mb-3 text-[#25D366]" size={28} />
          <h3 className="text-xl font-black mb-2">📞 Need Help?</h3>
          <p className="text-muted-foreground text-sm mb-5">
            Contact us on WhatsApp for quick assistance. We respond within minutes!
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-black px-7 py-3 rounded-full transition-colors shadow-lg shadow-[#25D366]/20"
            data-testid="button-whatsapp-return"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Policy effective for all orders. For questions, contact us via WhatsApp Mon–Sat 9am–9pm.
        </p>
      </main>
    </div>
  );
}
