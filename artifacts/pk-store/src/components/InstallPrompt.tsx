import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

const LS_KEY = 'sw_install_dismissed_at';
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY);
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(LS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-sm z-50
                 bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 p-4
                 flex items-center gap-3 animate-slide-up"
      role="banner"
      aria-label="Install SmartWear app"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl select-none">
        📱
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm leading-tight">Install SmartWear App</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
          Best shopping experience, works offline
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap hover:bg-primary/90 transition-colors flex-shrink-0"
        data-testid="button-pwa-install"
      >
        <Download size={12} />
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
        aria-label="Dismiss install prompt"
      >
        <X size={16} />
      </button>
    </div>
  );
}
