/**
 * DEV-ONLY visual harness for the ported Website Onboarding wizard.
 *
 *   npx vite --config scripts/preview/vite.config.ts
 *
 * It mounts the wizard with a FAKE shop and a no-op persistence stub so the
 * flow can be reviewed without Supabase credentials. It is NOT part of the
 * application: it lives outside `src/`, `npm run build` never sees it, and it
 * deliberately contains no authentication bypass — the real route
 * (`website-onboarding`) still requires a signed-in Growth Partner session.
 */

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import OnboardingWizard, { type SaveKind, type SaveState } from '../../src/website-onboarding/OnboardingWizard';
import { initialData, type SalonData } from '../../src/website-onboarding/types';
import './preview.css';

function Harness() {
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [log, setLog] = useState<string[]>([]);

  const onPersist = async (data: SalonData, step: number, kind: SaveKind) => {
    setSaveState('saving');
    await new Promise((r) => setTimeout(r, 250));
    setSaveState('saved');
    setLog((prev) =>
      [`${new Date().toLocaleTimeString()} · ${kind} · step ${step + 1} · ${data.salonName}`, ...prev].slice(0, 4),
    );
    return true;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#fcf9f8]">
      <div className="shrink-0 bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-1.5 text-[11px] font-bold">
        DEV PREVIEW — mock shop, no Supabase, no auth. Not part of the shipped app.
      </div>
      <div className="flex-1 min-h-0">
        <OnboardingWizard
          shop={{
            salonId: 'demo-salon',
            name: 'Glow Beauty Parlour',
            area: 'Vaishali Nagar',
            city: 'Jaipur',
          }}
          initialData={initialData}
          initialStep={0}
          hasDraft={false}
          lastSavedLabel={null}
          saveState={saveState}
          saveMessage={null}
          onPersist={onPersist}
          onExit={() => window.alert('onExit() → returns to the Growth Partner dashboard')}
        />
      </div>
      {log.length > 0 && (
        <div className="shrink-0 bg-gray-900 text-gray-300 px-4 py-1.5 text-[10px] font-mono truncate">
          persist: {log[0]}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
