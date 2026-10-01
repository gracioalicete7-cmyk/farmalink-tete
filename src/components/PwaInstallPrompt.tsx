import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Shield, Sparkles } from 'lucide-react';
import { FarmaLinkLogo } from '../lib/logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed or inside an APK / WebView wrapper
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as unknown as { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('installed=true');

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt if not dismissed recently
      const dismissed = localStorage.getItem('farmalink_pwa_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers / iOS
      alert(
        'Para instalar o FarmaLink Tete no seu telemóvel:\n\n' +
        '1. No Chrome: Toque nos 3 pontinhos (⋮) e escolha "Instalar aplicativo" ou "Adicionar ao ecrã principal".\n' +
        '2. No Safari (iPhone): Toque no botão Partilhar e selecione "Adicionar ao Ecrã Principal".'
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('farmalink_pwa_dismissed', 'true');
  };

  if (installed || !showPrompt) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/30 animate-in slide-in-from-bottom-5 duration-300"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        title="Dispensar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600/90 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-md">
          <Smartphone className="w-6 h-6 text-emerald-100" />
        </div>
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-white leading-tight">Instalar FarmaLink Tete</h4>
            <span className="text-[10px] font-extrabold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
              APK / App
            </span>
          </div>
          <p className="text-xs text-emerald-100/80 leading-snug">
            Aceda mais rápido e consulte medicamentos de serviço 24h sem gastar muitos dados móveis.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition-colors"
        >
          Mais tarde
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar Agora</span>
        </button>
      </div>
    </div>
  );
};
