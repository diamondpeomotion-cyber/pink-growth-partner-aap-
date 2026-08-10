// Website Onboarding wizard shell.
//
// Adapted from NEW-TAMPLETE-APP `src/App.tsx`. Differences, all deliberate:
//   * it is a SCREEN inside the Growth Partner app, not an app root — no
//     login/sign-up, no router, no global localStorage key;
//   * every draft is scoped to ONE shop passed in as an immutable prop, so it
//     cannot be repointed at another shop;
//   * the template's 25-screen developer navigator and its salon-owner
//     dashboard (screens 18-25) are not mounted — the Growth Partner dashboard
//     stays exactly as it was;
//   * persistence is delegated upward (Supabase draft / submit).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CloudOff,
  Loader2,
  Lock,
  Save,
  Send,
  Store,
} from 'lucide-react';

import type { SalonData } from './types';
import OnboardingWelcome from './screens/OnboardingWelcome';
import HeroSplit from './screens/HeroSplit';
import StepTemplate from './screens/StepTemplate';
import StepDetails from './screens/StepDetails';
import StepServices from './screens/StepServices';
import StepTeam from './screens/StepTeam';
import StepPhotos from './screens/StepPhotos';
import StepSocials from './screens/StepSocials';
import StepLocation from './screens/StepLocation';
import StepContactBooking from './screens/StepContactBooking';
import StepPublish from './screens/StepPublish';
import StepAIContentReview from './screens/StepAIContentReview';
import StepFullWebsitePreview from './screens/StepFullWebsitePreview';
import StepPublishSetup from './screens/StepPublishSetup';
import StepPublishSuccess from './screens/StepPublishSuccess';
import StaffManagementModule from './components/StaffManagementModule';

export const MAX_STEP_INDEX = 14;
export const TOTAL_STEPS = MAX_STEP_INDEX + 1;

const STEP_LABELS: string[] = [
  'Welcome',
  'Overview',
  'Template',
  'Salon Details',
  'Services & Packages',
  'Team Setup',
  'Photo Gallery',
  'Socials & Reels',
  'Location & Hours',
  'Contact & Booking',
  'Appearance',
  'Content Review',
  'Full Preview',
  'Publish Setup',
  'Submitted',
];

export type SaveKind = 'draft' | 'submit';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  /** Immutable shop context — the wizard never changes it. */
  shop: { salonId: string; name: string; area?: string; city?: string };
  initialData: SalonData;
  initialStep: number;
  hasDraft: boolean;
  lastSavedLabel: string | null;
  saveState: SaveState;
  saveMessage: string | null;
  /** Persist upward. Resolves true when the write succeeded. */
  onPersist: (data: SalonData, step: number, kind: SaveKind) => Promise<boolean>;
  onExit: () => void;
}

export default function OnboardingWizard({
  shop,
  initialData,
  initialStep,
  hasDraft,
  lastSavedLabel,
  saveState,
  saveMessage,
  onPersist,
  onExit,
}: Props) {
  const [step, setStep] = useState<number>(Math.min(MAX_STEP_INDEX, Math.max(0, initialStep)));
  const [data, setData] = useState<SalonData>(initialData);
  const [showStaffModule, setShowStaffModule] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Latest values for the async save queue. Written from an effect (never
  // during render) and overridable per call so a save fired in the same tick
  // as a state update still persists the new value.
  const dataRef = useRef(data);
  const stepRef = useRef(step);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const persist = useCallback(
    async (
      kind: SaveKind = 'draft',
      silent = false,
      override?: { data?: SalonData; step?: number },
    ) => {
      const payload = override?.data ?? dataRef.current;
      const at = override?.step ?? stepRef.current;
      dataRef.current = payload;
      stepRef.current = at;
      const ok = await onPersist(payload, at, kind);
      if (!silent) {
        showToast(
          ok
            ? kind === 'submit'
              ? 'Website sent to the Shop Owner for approval'
              : 'Draft saved'
            : 'Saved on this device only — Supabase save failed',
        );
      }
      return ok;
    },
    [onPersist, showToast],
  );

  /** Screens call onSave() on blur/change — keep it quiet and non-blocking. */
  const handleAutoSave = useCallback(() => {
    void persist('draft', true);
  }, [persist]);

  const goToStep = useCallback((target: number) => {
    setStep(Math.min(MAX_STEP_INDEX, Math.max(0, target)));
  }, []);

  const nextStep = useCallback(() => {
    const current = stepRef.current;
    const target = Math.min(MAX_STEP_INDEX, current + 1);
    const advanced: SalonData = {
      ...dataRef.current,
      lastCompletedStep: Math.max(dataRef.current.lastCompletedStep || 0, current),
    };
    setData(advanced);
    setStep(target);
    void persist('draft', true, { data: advanced, step: target });
  }, [persist]);

  const prevStep = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  /** Step 14 (Publish Setup) → submit the proposal for owner approval. */
  const submitForApproval = useCallback(async () => {
    const ok = await persist('submit');
    if (ok) setStep(MAX_STEP_INDEX);
  }, [persist]);

  const progress = useMemo(() => Math.round(((step + 1) / TOTAL_STEPS) * 100), [step]);

  const headerStatus = () => {
    if (saveState === 'saving') {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
        </span>
      );
    }
    if (saveState === 'error') {
      return (
        <span
          className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600"
          title={saveMessage ?? undefined}
        >
          <CloudOff className="w-3.5 h-3.5" /> Local only
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
        <Check className="w-3.5 h-3.5" /> Saved
      </span>
    );
  };

  if (showStaffModule) {
    return (
      <div className="h-full w-full flex flex-col bg-[#f9f9f9] font-sans text-gray-900 overflow-hidden">
        <WizardHeader
          shop={shop}
          title="Staff Management"
          subtitle={`${shop.name} · Team roster`}
          progress={null}
          status={headerStatus()}
          onBack={() => setShowStaffModule(false)}
          onSaveDraft={() => void persist('draft')}
        />
        <main className="flex-1 flex overflow-hidden min-h-0">
          <StaffManagementModule
            data={data}
            setData={(d) => setData(d)}
            onSave={handleAutoSave}
            onBackToWizard={() => setShowStaffModule(false)}
          />
        </main>
        <Toast message={toast} />
      </div>
    );
  }

  const scrollableStep = step === 0 || step === 1;

  return (
    <div className="h-full w-full flex flex-col bg-[#f9f9f9] font-sans text-gray-900 overflow-hidden">
      <WizardHeader
        shop={shop}
        title="Website Onboarding"
        subtitle={`Step ${step + 1} of ${TOTAL_STEPS} · ${STEP_LABELS[step]}`}
        progress={progress}
        status={headerStatus()}
        onBack={step === 0 ? onExit : prevStep}
        onSaveDraft={() => void persist('draft')}
      />

      <main
        className={`flex-1 min-h-0 flex ${scrollableStep ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {step === 0 && (
          <OnboardingWelcome
            shopName={shop.name}
            shopArea={shop.area || shop.city}
            hasDraft={hasDraft}
            lastSavedLabel={lastSavedLabel}
            onNext={nextStep}
            onResume={
              hasDraft && (data.lastCompletedStep ?? 0) > 0
                ? () => goToStep(Math.min(MAX_STEP_INDEX, (data.lastCompletedStep ?? 0) + 1))
                : undefined
            }
          />
        )}
        {step === 1 && <HeroSplit onNext={nextStep} />}
        {step === 2 && (
          <StepTemplate data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 3 && (
          <StepDetails data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 4 && (
          <StepServices data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 5 && (
          <StepTeam
            data={data}
            setData={setData}
            onNext={nextStep}
            onPrev={prevStep}
            onSave={handleAutoSave}
            onOpenStaffManagement={() => setShowStaffModule(true)}
          />
        )}
        {step === 6 && (
          <StepPhotos data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 7 && (
          <StepSocials data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 8 && (
          <StepLocation data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 9 && (
          <StepContactBooking data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 10 && (
          <StepPublish data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 11 && (
          <StepAIContentReview data={data} setData={setData} onNext={nextStep} onPrev={prevStep} onSave={handleAutoSave} />
        )}
        {step === 12 && (
          <StepFullWebsitePreview
            data={data}
            setData={setData}
            onNext={nextStep}
            onPrev={prevStep}
            onSave={handleAutoSave}
            onEditSection={(section) => {
              const map: Record<string, number> = {
                details: 3,
                services: 4,
                team: 5,
                gallery: 6,
                socials: 7,
                location: 8,
                contact: 9,
                appearance: 10,
                content: 11,
              };
              const target = map[section];
              if (typeof target === 'number') goToStep(target);
            }}
          />
        )}
        {step === 13 && (
          <StepPublishSetup
            data={data}
            setData={setData}
            onNext={() => void submitForApproval()}
            onPrev={prevStep}
            onSave={handleAutoSave}
          />
        )}
        {step === 14 && (
          <StepPublishSuccess
            data={data}
            setData={setData}
            onNext={onExit}
            onSave={handleAutoSave}
          />
        )}
      </main>

      {step === 13 && (
        <div className="shrink-0 px-4 py-2.5 bg-white border-t border-gray-200 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5 min-w-0">
            <Lock className="w-3.5 h-3.5 shrink-0 text-[#ac0053]" />
            <span className="truncate">
              Submitting sends the website to the Shop Owner for approval — it does not make the
              shop public.
            </span>
          </p>
          <button
            onClick={() => void submitForApproval()}
            disabled={saveState === 'saving'}
            className="shrink-0 bg-[#ac0053] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#8f0044] transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Submit for approval
          </button>
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

function WizardHeader({
  shop,
  title,
  subtitle,
  progress,
  status,
  onBack,
  onSaveDraft,
}: {
  shop: { name: string; area?: string; city?: string };
  title: string;
  subtitle: string;
  progress: number | null;
  status: React.ReactNode;
  onBack: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <header className="shrink-0 bg-white border-b border-gray-200 z-40">
      <div className="h-16 px-3 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-pink-50 text-[#ac0053] transition-colors shrink-0"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>
            <p className="text-[11px] text-gray-500 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Active shop is display-only: it is resolved from the database and
              cannot be switched from inside the builder. */}
          <span
            className="hidden sm:flex items-center gap-1.5 max-w-[220px] px-2.5 py-1.5 rounded-xl bg-pink-50 border border-pink-100 text-[11px] font-bold text-[#ac0053]"
            title={`${shop.name}${shop.area ? ` · ${shop.area}` : ''}`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{shop.name}</span>
            <Lock className="w-3 h-3 shrink-0 opacity-70" />
          </span>
          {status}
          <button
            onClick={onSaveDraft}
            className="bg-gray-900 text-white px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 hover:bg-black transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
      </div>

      {progress !== null && (
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-full bg-[#ac0053] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </header>
  );
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 right-6 z-[120] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
