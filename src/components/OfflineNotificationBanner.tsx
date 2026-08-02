import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Database, X } from 'lucide-react';

interface OfflineNotificationBannerProps {
  isOnline: boolean;
}

export default function OfflineNotificationBanner({ isOnline }: OfflineNotificationBannerProps) {
  // Track which offline "session" the user dismissed instead of resetting the
  // flag from an effect. Deriving it during render means the banner reappears
  // immediately on the next disconnect without an extra render pass.
  const [dismissedWhileOffline, setDismissedWhileOffline] = useState(false);

  if (isOnline && dismissedWhileOffline) {
    // Coming back online ends the current offline session.
    setDismissedWhileOffline(false);
  }

  const isVisible = !isOnline && !dismissedWhileOffline;

  return (
    // Keeping AnimatePresence mounted (and toggling its child) is what allows
    // the exit animation to run; returning null early skipped it entirely.
    <AnimatePresence>
      {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[140] w-[calc(100%-2rem)] max-w-lg pointer-events-auto"
      >
        <div className="bg-gradient-to-r from-amber-900/95 via-amber-950/95 to-neutral-900/95 backdrop-blur-md text-white p-3 px-4 rounded-2xl shadow-xl border border-amber-500/30 flex items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300 mt-0.5 sm:mt-0">
              <WifiOff size={16} />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-200 tracking-tight flex items-center gap-1.5">
                  Offline Mode Active
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-400/30 flex items-center gap-1">
                  <Database size={10} /> Cached Data
                </span>
              </div>
              <p className="text-[11px] text-amber-100/80 leading-tight">
                Some features may be limited. Loading data from local cache until connectivity is restored.
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissedWhileOffline(true)}
            className="text-amber-300/70 hover:text-amber-200 p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Dismiss offline alert"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
