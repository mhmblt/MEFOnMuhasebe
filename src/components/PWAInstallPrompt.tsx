/**
 * PWA Install Prompt Component
 * 
 * Shows an install prompt for Progressive Web App installation
 * on both mobile and desktop browsers.
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS Safari (doesn't support beforeinstallprompt)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isInStandaloneMode) {
            setTimeout(() => setShowPrompt(true), 3000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        }
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    // Don't show if already installed
    if (isInstalled) return null;

    // Check if it's iOS (show different message)
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-4 right-4 z-[100] max-w-sm"
                >
                    <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 
                                  rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                        {/* Gradient top line */}
                        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <Smartphone className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">
                                            Uygulamayı Yükle
                                        </h3>
                                        <p className="text-xs text-neutral-400">
                                            Hızlı erişim için
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDismiss}
                                    className="w-6 h-6 rounded-lg flex items-center justify-center
                                             text-neutral-500 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Message */}
                            <p className="text-neutral-400 text-xs mb-4">
                                {isIOS ? (
                                    <>
                                        Safari'de <span className="text-white">⬆️ Paylaş</span> butonuna tıklayıp{' '}
                                        <span className="text-white">"Ana Ekrana Ekle"</span> seçin.
                                    </>
                                ) : (
                                    'MEF Ön Muhasebe uygulamasını cihazınıza yükleyerek daha hızlı erişim sağlayın.'
                                )}
                            </p>

                            {/* Buttons */}
                            {!isIOS && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 px-3 py-2 rounded-xl text-sm font-medium
                                                 text-neutral-400 hover:text-white hover:bg-white/5 
                                                 transition-colors"
                                    >
                                        Şimdi Değil
                                    </button>
                                    <button
                                        onClick={handleInstall}
                                        className="flex-1 px-3 py-2 rounded-xl text-sm font-medium
                                                 bg-gradient-to-r from-violet-500 to-purple-500
                                                 text-white flex items-center justify-center gap-2
                                                 hover:opacity-90 transition-opacity"
                                    >
                                        <Download className="w-4 h-4" />
                                        Yükle
                                    </button>
                                </div>
                            )}

                            {isIOS && (
                                <button
                                    onClick={handleDismiss}
                                    className="w-full px-3 py-2 rounded-xl text-sm font-medium
                                             text-neutral-400 hover:text-white hover:bg-white/5 
                                             transition-colors"
                                >
                                    Anladım
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
