import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // For Android/Chrome
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If it's iOS and not already in standalone mode, show instructions
    if (isIOSDevice && !(window.navigator as any).standalone) {
      const hasSeenPrompt = localStorage.getItem('ios-prompt-seen');
      if (!hasSeenPrompt) {
        setShowPrompt(true);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const closePrompt = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('ios-prompt-seen', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100]"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-primary to-brand-secondary" />
          
          <button 
            onClick={closePrompt}
            className="absolute top-4 right-4 p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-5">
            <div className="bg-brand-primary/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500">
              <Download className="w-8 h-8 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-display font-bold text-surface-900">Santos Auto no seu Celular</h3>
              <p className="text-sm text-surface-500 mt-1 leading-tight">
                {isIOS 
                  ? 'Toque em compartilhar e "Adicionar à Tela de Início".' 
                  : 'Instale o aplicativo para acesso rápido e notificações.'}
              </p>
              
              {!isIOS && (
                <button 
                  onClick={handleInstallClick}
                  className="mt-4 w-full bg-brand-primary text-white text-sm font-bold py-3 rounded-xl hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 active:scale-[0.98]"
                >
                  Baixar Aplicativo
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
