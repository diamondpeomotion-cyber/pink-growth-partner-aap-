// Entry screen of the Website Onboarding flow.
//
// Ported from NEW-TAMPLETE-APP `screens/Landing.tsx` (its pre-publish welcome
// state). The published-dashboard half of that file is intentionally NOT part
// of this integration: the Growth Partner app keeps its own dashboard.

import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Check, Store, RefreshCw } from 'lucide-react';

interface Props {
  /** Shop the wizard is locked to — display only, cannot be changed here. */
  shopName: string;
  shopArea?: string;
  /** true when a saved draft was found for this shop. */
  hasDraft: boolean;
  lastSavedLabel?: string | null;
  onNext: () => void;
  onResume?: () => void;
}

export default function OnboardingWelcome({
  shopName,
  shopArea,
  hasDraft,
  lastSavedLabel,
  onNext,
  onResume,
}: Props) {
  return (
    <div className="min-h-full bg-[#fcfbf9] flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center py-14 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#ffd9e1] text-[#8f0044] rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Builder
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight leading-tight">
            Create the Website for
            <br />
            <span className="text-[#ac0053]">{shopName}</span>
          </h1>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 mb-6">
            <Store className="w-3.5 h-3.5 text-[#ac0053]" />
            <span>
              Locked to this shop{shopArea ? ` · ${shopArea}` : ''}
            </span>
          </div>

          <p className="text-sm md:text-base text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            A guided setup for the shop&apos;s storefront: template, services, team, gallery,
            location, booking rules and content review — then submit it to the Shop Owner for
            approval.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {hasDraft && onResume && (
              <button
                onClick={onResume}
                className="bg-white border border-[#ac0053] text-[#ac0053] px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-pink-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Resume saved draft
              </button>
            )}
            <button
              onClick={onNext}
              className="bg-[#ac0053] text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#8f0044] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              {hasDraft ? 'Start from the beginning' : 'Start Onboarding Wizard'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {hasDraft && lastSavedLabel && (
            <p className="text-[11px] text-gray-400 mt-4">Draft last saved {lastSavedLabel}</p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-xs text-gray-500 font-semibold">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#ac0053]" /> Dynamic Scheduling
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#ac0053]" /> Premium Templates
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#ac0053]" /> Staff Roster Sync
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
