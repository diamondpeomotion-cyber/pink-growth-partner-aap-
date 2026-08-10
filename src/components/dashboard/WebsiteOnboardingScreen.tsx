// White Label → Website.
//
// Route entry that replaces the old WebsiteSettingsScreen / WebsitePreviewScreen
// mock builder with the Website Onboarding flow ported from NEW-TAMPLETE-APP.
//
// Responsibilities kept here (outside the ported wizard):
//   * resolve the partner + their attributed shops from the SHARED Supabase
//     project (anon key + user session, RLS enforced),
//   * pin the wizard to exactly one shop, chosen in-app and re-validated
//     against the server allow-list — never from a URL parameter,
//   * load/save the website draft through the existing onboarding-application
//     and salon-setup-proposal structures.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ChevronRight, Loader2, MapPin, Plus, Shield, Store } from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';
import {
  loadShopContext,
  rememberSelectedShop,
  stripShopParamsFromUrl,
  type PartnerShop,
} from '../../lib/shopContext';
import OnboardingWizard, { type SaveKind, type SaveState } from '../../website-onboarding/OnboardingWizard';
import { createBlankSalonData, type SalonData } from '../../website-onboarding/types';
import {
  loadWebsiteOnboarding,
  saveWebsiteOnboarding,
  writeLocalDraft,
  type OnboardingRecord,
} from '../../website-onboarding/lib/websiteOnboardingRepository';

type Phase = 'loading' | 'picker' | 'ready' | 'error';

const relativeTime = (iso: string | null): string | null => {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function WebsiteOnboardingScreen({
  onBack,
}: {
  onBack: () => void;
  /** kept for route-signature parity with the other dashboard screens */
  onNavigate?: (page: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [shops, setShops] = useState<PartnerShop[]>([]);
  const [shop, setShop] = useState<PartnerShop | null>(null);

  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const applicationIdRef = useRef<string | null>(null);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  // A shop id in the address bar must never select or switch the shop.
  useEffect(() => {
    stripShopParamsFromUrl();
  }, []);

  const openShop = useCallback(
    async (target: PartnerShop, pid: string, uid: string) => {
      const client = supabase;
      if (!client) return;
      setPhase('loading');
      setShop(target);
      rememberSelectedShop(uid, target.salonId);
      const loaded = await loadWebsiteOnboarding(client, {
        partnerId: pid,
        salonId: target.salonId,
        userId: uid,
      });
      applicationIdRef.current = loaded.applicationId;
      setRecord(loaded);
      setNotice(loaded.warning);
      setSaveState(loaded.warning ? 'error' : 'saved');
      setSaveMessage(loaded.warning);
      setPhase('ready');
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!supabase) {
        setError('Supabase is not configured for this deployment.');
        setPhase('error');
        return;
      }
      try {
        const ctx = await loadShopContext(supabase);
        if (cancelled) return;
        setPartnerId(ctx.partnerId);
        setUserId(ctx.userId);
        setShops(ctx.shops);

        if (!ctx.userId) {
          setError('Your session has expired. Please sign in again.');
          setPhase('error');
          return;
        }
        if (!ctx.partnerId) {
          setError('No Growth Partner profile is linked to this account yet.');
          setPhase('error');
          return;
        }
        if (ctx.shops.length === 0) {
          setPhase('picker');
          return;
        }
        if (ctx.selected) {
          await openShop(ctx.selected, ctx.partnerId, ctx.userId);
          return;
        }
        setPhase('picker');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load your shops.');
        setPhase('error');
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [openShop]);

  const handlePersist = useCallback(
    async (data: SalonData, step: number, kind: SaveKind): Promise<boolean> => {
      const client = supabase;
      if (!client || !partnerId || !userId || !shop) return false;

      // Local cache first: an offline edit is never lost.
      writeLocalDraft(userId, shop.salonId, step, data);
      setSaveState('saving');

      const run = async (): Promise<boolean> => {
        try {
          const result = await saveWebsiteOnboarding(client, {
            partnerId,
            salonId: shop.salonId,
            userId,
            applicationId: applicationIdRef.current,
            data,
            step,
            submit: kind === 'submit',
          });
          applicationIdRef.current = result.applicationId;
          setSaveState('saved');
          setSaveMessage(result.message);
          setNotice(null);
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Supabase save failed.';
          setSaveState('error');
          setSaveMessage(message);
          setNotice(`Saved on this device only — ${message}`);
          return false;
        }
      };

      const next = saveQueue.current.then(run, run);
      saveQueue.current = next.catch(() => undefined);
      return next as Promise<boolean>;
    },
    [partnerId, userId, shop],
  );

  // ---------------------------------------------------------------- states
  if (phase === 'loading') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-[#fcf9f8] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-gray-500">
          {shop ? `Loading the website for ${shop.name}…` : 'Loading your shops…'}
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="h-full w-full flex flex-col bg-[#fcf9f8]">
        <ScreenHeader onBack={onBack} title="Website" subtitle="White Label" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-gray-900 mb-1">Website onboarding unavailable</h2>
            <p className="text-xs leading-6 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'picker' || !shop || !record) {
    return (
      <div className="h-full w-full flex flex-col bg-[#fcf9f8] overflow-hidden">
        <ScreenHeader onBack={onBack} title="Website" subtitle="Choose the shop to build for" />
        <div className="flex-1 overflow-y-auto px-[var(--page-margin)] py-5">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-start gap-2.5 rounded-2xl border border-pink-100 bg-pink-50/60 p-3.5">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-5 text-gray-700">
                Only shops attributed to your Growth Partner account are listed. The selection is
                verified against the database on every load — it cannot be changed through a link
                or a URL parameter.
              </p>
            </div>

            {shops.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                <Store className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <h2 className="text-sm font-bold text-gray-900 mb-1">No shops yet</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Add and get a shop attributed to you before building its website.
                </p>
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                >
                  <Plus size={14} /> Back to dashboard
                </button>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {shops.map((s) => (
                  <li key={s.attributionId}>
                    <button
                      onClick={() => {
                        if (partnerId && userId) void openShop(s, partnerId, userId);
                      }}
                      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow transition-all active:scale-[0.99]"
                    >
                      <span className="w-10 h-10 rounded-xl bg-pink-50 text-primary flex items-center justify-center shrink-0">
                        <Store size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900 truncate">
                          {s.name}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                          <MapPin size={11} />
                          {[s.area, s.city].filter(Boolean).join(', ') || 'Location not set'}
                        </span>
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                        {s.status}
                      </span>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {notice && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-[11px] font-semibold flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span className="truncate">{notice}</span>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <OnboardingWizard
          key={shop.salonId}
          shop={{ salonId: shop.salonId, name: shop.name, area: shop.area, city: shop.city }}
          initialData={
            record.data ??
            createBlankSalonData({ name: shop.name, city: shop.city, area: shop.area })
          }
          initialStep={record.step}
          hasDraft={record.source !== 'empty'}
          lastSavedLabel={relativeTime(record.updatedAt)}
          saveState={saveState}
          saveMessage={saveMessage}
          onPersist={handlePersist}
          onExit={onBack}
        />
      </div>
    </div>
  );
}

function ScreenHeader({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto w-full flex items-center gap-3 px-[var(--page-margin)] h-16">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-primary truncate">{title}</h1>
          <p className="text-[10px] text-gray-500 truncate">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
