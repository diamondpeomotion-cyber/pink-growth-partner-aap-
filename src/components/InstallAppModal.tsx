import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Laptop,
  Globe,
  Compass,
  MoreVertical,
  PlusSquare,
  Check,
  Copy
} from 'lucide-react';
import { detectBrowserAndOS, InstallHelpTab, DeviceBrowserInfo } from '../utils/browserDetection';
import { copyToClipboard } from '../utils/clipboard';
import { getPwaInstallState, subscribePwaInstall, triggerPwaInstall } from '../utils/pwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  // Detect device & browser info once. Calling detectBrowserAndOS() twice
  // (and again from an effect) recomputed the same value on every open and
  // reset the user's tab choice.
  const [deviceInfo] = useState<DeviceBrowserInfo>(detectBrowserAndOS);

  // State for the selected helpTab - initialized automatically based on user's browser/OS
  const [helpTab, setHelpTab] = useState<InstallHelpTab>(() => deviceInfo.recommendedHelpTab);

  const [copiedLink, setCopiedLink] = useState(false);
  const [pwaState, setPwaState] = useState(getPwaInstallState);
  const [installSuccess, setInstallSuccess] = useState(false);

  // beforeinstallprompt is captured GLOBALLY (src/utils/pwaInstall, started in
  // main.tsx before first render) because the one-shot event usually fires on
  // the login screen — long before this modal mounts on the dashboard.
  // Listening only here meant the event was already gone, `deferredPrompt`
  // stayed null and the install button silently degraded into a Share sheet.
  useEffect(() => subscribePwaInstall(() => setPwaState(getPwaInstallState())), []);

  const isIos = deviceInfo.os === 'ios';

  const handleTriggerInstall = async () => {
    const outcome = await triggerPwaInstall();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
      setPwaState(getPwaInstallState());
    }
  };

  // Share is a utility action, NOT an install path — it must never masquerade
  // as the install button's fallback.
  const handleShareApp = async () => {
    if (!('share' in navigator)) {
      handleCopyLink();
      return;
    }
    try {
      await navigator.share({
        title: 'Nexora Partner App',
        text: 'Install the Nexora Growth Partner App for daily shop commission tracking!',
        url: window.location.origin
      });
    } catch {
      // User cancelled share
    }
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(window.location.origin);
    if (copied) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        ></motion.div>

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl z-10 border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#b90064] via-pink-700 to-rose-600 p-5 text-white relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone size={26} className="text-pink-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-black text-base tracking-tight text-white">Install Nexora App</h3>
                  <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-white/30 uppercase tracking-widest">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-white/80 font-medium">Add to your phone or desktop home screen</p>
              </div>
            </div>

            {/* Auto-Detection Badge */}
            <div className="mt-3.5 bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/15 flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300 shrink-0" />
                <span className="text-white/90">
                  Detected: <strong className="text-white">{deviceInfo.osName}</strong> ({deviceInfo.browserName})
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 shrink-0">
                <CheckCircle2 size={10} /> Auto-Selected
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {installSuccess && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-3 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>App installation initiated! Check your home screen shortly.</span>
            </div>
          )}

          {/* Navigation Tabs for helpTab selection */}
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'android' as InstallHelpTab, label: 'Android', icon: Smartphone },
              { id: 'ios' as InstallHelpTab, label: 'iPhone/iPad', icon: Smartphone },
              { id: 'chrome' as InstallHelpTab, label: 'Chrome', icon: Globe },
              { id: 'safari' as InstallHelpTab, label: 'Safari', icon: Compass },
              { id: 'desktop' as InstallHelpTab, label: 'Desktop', icon: Laptop },
            ].map((tab) => {
              const isSelected = helpTab === tab.id;
              const isDetected = deviceInfo.recommendedHelpTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setHelpTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <tab.icon size={13} />
                  <span>{tab.label}</span>
                  {isDetected && !isSelected && (
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Help Instructions Content Area */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* ANDROID INSTRUCTIONS */}
            {helpTab === 'android' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone size={15} className="text-primary" />
                    <span>Android Installation Guide</span>
                  </h4>
                  <span className="text-[10px] bg-pink-50 text-primary font-bold px-2 py-0.5 rounded-md border border-pink-100">
                    Chrome / Android
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Open Menu</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Tap the <strong>three dots <MoreVertical size={12} className="inline text-gray-700" /></strong> in the top right corner of Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Tap "Install App" or "Add to Home Screen"</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Select <strong>Install app</strong> or <strong>Add to Home screen</strong> from the dropdown list.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Confirm Installation</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Tap <strong>Install</strong>. Nexora will be added directly to your app drawer!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IOS INSTRUCTIONS */}
            {helpTab === 'ios' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone size={15} className="text-primary" />
                    <span>iPhone & iPad Safari Guide</span>
                  </h4>
                  <span className="text-[10px] bg-pink-50 text-primary font-bold px-2 py-0.5 rounded-md border border-pink-100">
                    iOS Safari
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Open in Safari</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Ensure you are using the official <strong>Apple Safari browser</strong> on your iOS device.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Tap Share Button</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Tap the <strong>Share <Share2 size={12} className="inline text-primary" /></strong> button at the bottom navigation bar.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Select "Add to Home Screen"</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Scroll down and tap <strong>Add to Home Screen <PlusSquare size={12} className="inline text-gray-700" /></strong>, then tap <strong>Add</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHROME INSTRUCTIONS */}
            {helpTab === 'chrome' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe size={15} className="text-primary" />
                    <span>Google Chrome Guide</span>
                  </h4>
                  <span className="text-[10px] bg-pink-50 text-primary font-bold px-2 py-0.5 rounded-md border border-pink-100">
                    Chrome Browser
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Look for Address Bar Icon</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        In Chrome, look for the <strong>Install Icon <Download size={12} className="inline text-primary" /></strong> on the right side of the URL bar.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Or Open Chrome Settings</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Click the <strong>3-dots menu <MoreVertical size={12} className="inline" /></strong> &gt; <strong>Save and Share</strong> &gt; <strong>Install Nexora...</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAFARI INSTRUCTIONS */}
            {helpTab === 'safari' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={15} className="text-primary" />
                    <span>Safari Browser Guide</span>
                  </h4>
                  <span className="text-[10px] bg-pink-50 text-primary font-bold px-2 py-0.5 rounded-md border border-pink-100">
                    Safari
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">File Menu &gt; Add to Dock (Mac)</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        On macOS Safari, click <strong>File</strong> in top menu bar and select <strong>Add to Dock</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Or Share Button (iOS)</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        On iPhone/iPad, use the <strong>Share <Share2 size={12} className="inline text-primary" /></strong> button and select <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DESKTOP INSTRUCTIONS */}
            {helpTab === 'desktop' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Laptop size={15} className="text-primary" />
                    <span>Desktop App Guide</span>
                  </h4>
                  <span className="text-[10px] bg-pink-50 text-primary font-bold px-2 py-0.5 rounded-md border border-pink-100">
                    PC / Mac
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-gray-700">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Use Supported Browser</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Launch <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Safari</strong> on your laptop.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Click Install in Address Bar</p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Click the computer icon or <strong>Install Nexora</strong> prompt in your address bar to launch as a standalone desktop window!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 space-y-2">
            {pwaState.installed ? (
              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Nexora installed — check your home screen!</span>
              </div>
            ) : pwaState.canPrompt ? (
              <button
                onClick={handleTriggerInstall}
                className="w-full bg-primary hover:bg-[#a00056] text-white h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-200/50 active:scale-95 transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Install App Now</span>
              </button>
            ) : (
              <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-2xl text-[11px] font-semibold leading-relaxed flex items-start gap-2">
                <Smartphone size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  {isIos
                    ? 'iPhone/iPad pe automatic install prompt nahi hota — upar diye steps follow karke Share → "Add to Home Screen" se install karein.'
                    : 'Is browser me install ka button address bar ya upar diye menu steps me milta hai — guide follow karein.'}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {'share' in navigator && !pwaState.installed && (
                <button
                  onClick={handleShareApp}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 size={15} className="text-gray-600" />
                  <span>Share App</span>
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={15} className="text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} className="text-gray-600" />
                    <span>Copy App Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
