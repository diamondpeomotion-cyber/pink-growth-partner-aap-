/**
 * Dev-only smoke test for the ported Website Onboarding flow.
 *
 *   npx tsx scripts/onboarding-smoke-test.tsx
 *
 * Renders the wizard in jsdom, walks every step (and the staff module), and
 * fails on any React error / thrown exception. It does NOT touch Supabase —
 * persistence is stubbed — so it is safe to run anywhere.
 *
 * Not part of the shipped bundle: it lives outside `src/`, nothing imports it.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://partner.nexora.test/?shopId=SOME-OTHER-SHOP&salon_id=EVIL',
  pretendToBeVisual: true,
});

const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
// Node 22 exposes `navigator` as a getter-only global — defineProperty it.
Object.defineProperty(g, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.getComputedStyle = dom.window.getComputedStyle;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: any) => clearTimeout(id);
g.localStorage = dom.window.localStorage;
g.sessionStorage = dom.window.sessionStorage;
g.IS_REACT_ACT_ENVIRONMENT = true;

const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const React = (await import('react')).default;

const OnboardingWizard = (await import('../src/website-onboarding/OnboardingWizard')).default;
const { initialData } = await import('../src/website-onboarding/types');
const { stripShopParamsFromUrl } = await import('../src/lib/shopContext');

const failures: string[] = [];
const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = String(args[0] ?? '');
  // React key/act warnings are noise here; real render failures are thrown.
  if (/Warning:|not wrapped in act|Each child in a list/.test(msg)) return;
  failures.push(msg);
  origError(...args);
};

// --- 1. URL guard -----------------------------------------------------------
stripShopParamsFromUrl();
const finalUrl = dom.window.location.href;
if (/shopId|salon_id/i.test(finalUrl)) {
  failures.push(`URL guard failed — shop params survived: ${finalUrl}`);
} else {
  console.log(`✓ URL shop params stripped → ${finalUrl}`);
}

// --- 2. Wizard renders on every step ---------------------------------------
const container = dom.window.document.getElementById('root')!;
const root = createRoot(container);

let persisted = 0;
const props = {
  shop: { salonId: 'salon-123', name: 'Glow Beauty Parlour', area: 'Vaishali Nagar', city: 'Jaipur' },
  initialData,
  initialStep: 0,
  hasDraft: false,
  lastSavedLabel: null,
  saveState: 'saved' as const,
  saveMessage: null,
  onPersist: async () => {
    persisted += 1;
    return true;
  },
  onExit: () => {},
};

const TOTAL = 15;
for (let step = 0; step < TOTAL; step += 1) {
  try {
    await act(async () => {
      root.render(React.createElement(OnboardingWizard, { ...props, key: step, initialStep: step }));
    });
    const text = container.textContent ?? '';
    if (text.trim().length === 0) failures.push(`Step ${step + 1} rendered empty`);
    if (!text.includes('Glow Beauty Parlour')) {
      failures.push(`Step ${step + 1} lost the locked shop context in the header`);
    }
    console.log(`✓ Step ${String(step + 1).padStart(2, '0')}/15 rendered (${text.length} chars)`);
  } catch (err) {
    failures.push(`Step ${step + 1} threw: ${(err as Error).message}`);
  }
}

// --- 3. Shop name is display-only in the wizard chrome ----------------------
const inputs = Array.from(container.querySelectorAll('input')) as any[];
const editableShopField = inputs.find(
  (i) => (i.value ?? '') === 'Glow Beauty Parlour' && i.getAttribute('data-shop-selector') !== null,
);
if (editableShopField) failures.push('Shop context is editable from inside the wizard');

await act(async () => {
  root.unmount();
});

console.error = origError;
if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n✓ Website Onboarding smoke test passed (${persisted} persist calls observed).`);
process.exit(0);
