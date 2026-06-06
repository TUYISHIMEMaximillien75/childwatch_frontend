import { useState, useEffect } from 'react';

let globalDeferredPrompt = null;
const listeners = new Set();

// Listen globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
    listeners.forEach((listener) => listener(e));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener(null));
    console.log('PWA was installed');
  });
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState(globalDeferredPrompt);

  useEffect(() => {
    const listener = (p) => setPrompt(p);
    listeners.add(listener);
    // If it was already captured before the component mounted
    if (globalDeferredPrompt && !prompt) {
      setPrompt(globalDeferredPrompt);
    }
    return () => listeners.delete(listener);
  }, [prompt]);

  const promptInstall = async () => {
    if (!globalDeferredPrompt) return;
    globalDeferredPrompt.prompt();
    const { outcome } = await globalDeferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    if (outcome === 'accepted') {
      globalDeferredPrompt = null;
      listeners.forEach((l) => l(null));
    }
  };

  return { installPrompt: prompt, promptInstall };
}
