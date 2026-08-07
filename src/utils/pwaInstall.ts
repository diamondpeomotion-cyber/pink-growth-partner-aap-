// Global PWA install-prompt capture.
//
// Chrome fires `beforeinstallprompt` exactly ONCE per page load, as soon as the
// installability criteria are met (manifest + service worker + secure ctxt).
// That moment almost always arrives while the LOGIN screen is up — long before
// any InstallAppModal mounts — so a listener inside the modal misses it and the
// modal's install button silently fell back to navigator.share. Capturing at
// module scope (imported by main.tsx before the first render) makes the event
// survive until any UI asks for it.

export interface DeferredPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallSnapshot {
  /** Native install prompt is captured and ready to trigger. */
  canPrompt: boolean;
  /** App is already installed (or running standalone). */
  installed: boolean;
}

let deferredPrompt: DeferredPromptEvent | null = null;
let installedFlag = false;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

const runningStandalone = (): boolean => {
  if (installedFlag) return true;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  } catch {
    /* ignore */
  }
  // iOS home-screen app mode
  return (navigator as { standalone?: boolean }).standalone === true;
};

/** Call once, before the first render. Idempotent. */
let initialised = false;
export function initPwaInstallCapture(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // keep it from showing Chrome's mini-infobar; we trigger manually
    deferredPrompt = event as DeferredPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    installedFlag = true;
    deferredPrompt = null;
    emit();
  });
}

export function getPwaInstallState(): PwaInstallSnapshot {
  return {
    canPrompt: deferredPrompt !== null && !runningStandalone(),
    installed: runningStandalone(),
  };
}

/** React-store style subscription; returns an unsubscribe function. */
export function subscribePwaInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Triggers the captured native prompt. The event is single-use, so it is
 * consumed regardless of the outcome.
 */
export async function triggerPwaInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const event = deferredPrompt;
  deferredPrompt = null;
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') installedFlag = true;
    emit();
    return outcome;
  } catch {
    emit();
    return 'unavailable';
  }
}
