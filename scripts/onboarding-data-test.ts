/**
 * Dev-only contract test for the Website Onboarding data layer.
 *
 *   npx tsx scripts/onboarding-data-test.ts
 *
 * Runs the shop-context guard and the load/save repository against an
 * in-memory fake of supabase-js. It asserts that:
 *   - only DB-attributed shops can become the active shop,
 *   - a cached/URL-supplied shop id cannot escape that allow-list,
 *   - saving hits the EXISTING tables + RPC (no new schema, no service role),
 *   - the legacy proposal payload still loads into the new wizard.
 *
 * No network, no real project. Lives outside `src/`; nothing imports it.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://partner.nexora.test/?shop=NOT-MINE',
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.localStorage = dom.window.localStorage;
g.sessionStorage = dom.window.sessionStorage;

const { loadShopContext, rememberSelectedShop } = await import('../src/lib/shopContext');
const { loadWebsiteOnboarding, saveWebsiteOnboarding, buildProposalPayload } = await import(
  '../src/website-onboarding/lib/websiteOnboardingRepository'
);
const { initialData } = await import('../src/website-onboarding/types');

const USER_ID = 'user-1';
const PARTNER_ID = 'partner-1';
const MY_SALON = 'salon-mine';
const OTHER_SALON = 'salon-not-mine';

const calls: Array<{ op: string; table?: string; args?: unknown }> = [];
const failures: string[] = [];
const assert = (cond: unknown, msg: string) => {
  if (cond) console.log(`✓ ${msg}`);
  else {
    failures.push(msg);
    console.log(`✗ ${msg}`);
  }
};

interface Fixture {
  proposalRow?: Record<string, unknown> | null;
  applicationRow?: Record<string, unknown> | null;
  rpcError?: { message: string; code?: string } | null;
}

function makeClient(fixture: Fixture = {}) {
  const tableRows: Record<string, unknown[]> = {
    growth_partners: [{ id: PARTNER_ID, user_id: USER_ID, full_name: 'Rahul Verma' }],
    shop_attributions: [
      {
        id: 'attr-1',
        salon_id: MY_SALON,
        status: 'active',
        attribution_method: 'qr',
        effective_from: '2026-01-01',
      },
    ],
    salons: [{ id: MY_SALON, name: 'Glow Beauty Parlour', city: 'Jaipur', area: 'Vaishali Nagar' }],
    shop_onboarding_applications: fixture.applicationRow ? [fixture.applicationRow] : [],
    salon_setup_proposals: fixture.proposalRow ? [fixture.proposalRow] : [],
  };

  const builder = (table: string, op: 'select' | 'insert' | 'update', payload?: unknown) => {
    const filters: Record<string, unknown> = {};
    const api: any = {
      select: () => api,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return api;
      },
      in: () => api,
      order: () => api,
      limit: () => api,
      maybeSingle: async () => ({ data: (tableRows[table] ?? [])[0] ?? null, error: null }),
      single: async () => {
        if (op === 'insert') {
          calls.push({ op: 'insert', table, args: payload });
          return { data: { id: 'app-new' }, error: null };
        }
        return { data: (tableRows[table] ?? [])[0] ?? null, error: null };
      },
      then: (resolve: any, reject?: any) => {
        if (op === 'update') calls.push({ op: 'update', table, args: payload });
        let rows = tableRows[table] ?? [];
        // Honour the attribution allow-list check.
        if (table === 'shop_attributions' && filters.salon_id) {
          rows = rows.filter((r: any) => r.salon_id === filters.salon_id);
        }
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
      },
    };
    return api;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: { id: USER_ID } }, error: null }),
    },
    from: (table: string) => ({
      select: (...a: unknown[]) => {
        calls.push({ op: 'select', table, args: a });
        return builder(table, 'select').select();
      },
      insert: (payload: unknown) => builder(table, 'insert', payload),
      update: (payload: unknown) => builder(table, 'update', payload),
    }),
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ op: 'rpc', table: name, args });
      if (fixture.rpcError) return { data: null, error: fixture.rpcError };
      return { data: 'proposal-1', error: null };
    },
  } as any;
}

// --------------------------------------------------------------- 1. context
console.log('\n— Shop context guard —');
const client = makeClient();
const ctx = await loadShopContext(client);
assert(ctx.partnerId === PARTNER_ID, 'partner resolved from growth_partners');
assert(ctx.shops.length === 1 && ctx.shops[0].salonId === MY_SALON, 'only attributed shops listed');
assert(ctx.selected?.salonId === MY_SALON, 'single attributed shop auto-selected');
assert(!dom.window.location.href.includes('shop='), 'URL shop param stripped on context load');

const forced = await loadShopContext(client, OTHER_SALON);
assert(forced.selected?.salonId === MY_SALON, 'requested foreign salon id is IGNORED (allow-list)');

rememberSelectedShop(USER_ID, OTHER_SALON);
const poisoned = await loadShopContext(client);
assert(
  poisoned.selected?.salonId === MY_SALON,
  'poisoned sessionStorage selection is discarded, falls back to an owned shop',
);

// --------------------------------------------------------------- 2. payload
console.log('\n— Payload contract —');
const payload = buildProposalPayload(initialData, 4, MY_SALON) as any;
assert(typeof payload.profile?.name === 'string', 'legacy `profile` key preserved');
assert(Array.isArray(payload.services), 'legacy `services` key preserved');
assert(typeof payload.template?.key === 'string', 'legacy `template.key` preserved');
assert(payload.onboarding?.salon_data?.salonName === initialData.salonName, 'full state under `onboarding`');
assert(payload.onboarding?.salon_id === MY_SALON, 'payload is stamped with the locked salon id');

// --------------------------------------------------------------- 3. load
console.log('\n— Load existing drafts —');
const legacyClient = makeClient({
  proposalRow: {
    id: 'prop-legacy',
    salon_id: MY_SALON,
    status: 'draft',
    updated_at: '2026-01-02T00:00:00Z',
    payload: {
      profile: { name: 'Legacy Parlour', city: 'Jaipur', area: 'Malviya Nagar', description: 'old' },
      services: [{ name: 'Facial', price: '₹1,499', duration: '60' }],
      template: { key: 'wellness' },
    },
  },
  applicationRow: { id: 'app-legacy', status: 'draft', current_step: 3 },
});
const legacy = await loadWebsiteOnboarding(legacyClient, {
  partnerId: PARTNER_ID,
  salonId: MY_SALON,
  userId: USER_ID,
});
assert(legacy.data?.salonName === 'Legacy Parlour', 'legacy payload maps into the new wizard');
assert(legacy.data?.services?.[0]?.price === 1499, 'formatted legacy price parsed to a number');
assert(legacy.applicationId === 'app-legacy', 'existing onboarding application reused (no duplicate)');

const modernClient = makeClient({
  proposalRow: {
    id: 'prop-new',
    salon_id: MY_SALON,
    status: 'draft',
    updated_at: '2026-02-02T00:00:00Z',
    payload: {
      profile: { name: 'x' },
      onboarding: { version: 2, step: 7, salon_data: { ...initialData, salonName: 'Saved Studio' } },
    },
  },
});
const modern = await loadWebsiteOnboarding(modernClient, {
  partnerId: PARTNER_ID,
  salonId: MY_SALON,
  userId: USER_ID,
});
assert(modern.data?.salonName === 'Saved Studio' && modern.step === 7, 'v2 draft restores data + step');

// --------------------------------------------------------------- 4. save
console.log('\n— Save / submit —');
calls.length = 0;
const saveClient = makeClient();
const saved = await saveWebsiteOnboarding(saveClient, {
  partnerId: PARTNER_ID,
  salonId: MY_SALON,
  userId: USER_ID,
  applicationId: null,
  data: initialData,
  step: 5,
  submit: false,
});
assert(saved.status === 'draft' && saved.persistedRemotely, 'draft save reported as persisted');
assert(
  calls.some((c) => c.op === 'insert' && c.table === 'shop_onboarding_applications'),
  'application created in the EXISTING shop_onboarding_applications table',
);
const rpcCall = calls.find((c) => c.op === 'rpc');
assert(rpcCall?.table === 'save_growth_partner_salon_setup', 'existing RPC used for the proposal');
assert((rpcCall?.args as any)?.p_submit === false, 'draft save does not submit to the owner');
assert(
  !calls.some((c) => JSON.stringify(c.args ?? '').includes('service_role')),
  'no service-role usage anywhere in the save path',
);

const submitted = await saveWebsiteOnboarding(saveClient, {
  partnerId: PARTNER_ID,
  salonId: MY_SALON,
  userId: USER_ID,
  applicationId: 'app-1',
  data: initialData,
  step: 13,
  submit: true,
});
assert(submitted.status === 'submitted', 'submit path flagged p_submit = true');

let rejected = false;
try {
  await saveWebsiteOnboarding(saveClient, {
    partnerId: PARTNER_ID,
    salonId: OTHER_SALON,
    userId: USER_ID,
    applicationId: null,
    data: initialData,
    step: 2,
    submit: false,
  });
} catch (err) {
  rejected = /not attributed/i.test((err as Error).message);
}
assert(rejected, 'writing to a NON-attributed salon is refused before it reaches the network');

// --------------------------------------------------------------- 5. offline
console.log('\n— Offline resilience —');
const brokenClient = makeClient({ rpcError: { message: 'network down' } });
let offlineError: string | null = null;
try {
  await saveWebsiteOnboarding(brokenClient, {
    partnerId: PARTNER_ID,
    salonId: MY_SALON,
    userId: USER_ID,
    applicationId: 'app-1',
    data: { ...initialData, salonName: 'Offline Edit' },
    step: 6,
    submit: false,
  });
} catch (err) {
  offlineError = (err as Error).message;
}
assert(offlineError === 'network down', 'server failures surface to the UI (never silently faked)');
const cached = dom.window.localStorage.getItem(`nexora_website_onboarding:${USER_ID}:${MY_SALON}`);
assert(!!cached && cached.includes('Offline Edit'), 'edit still cached locally, scoped per shop');
assert(
  dom.window.localStorage.getItem(`nexora_website_onboarding:${USER_ID}:${OTHER_SALON}`) === null,
  'local cache never leaks across shops',
);

console.log('');
if (failures.length > 0) {
  console.error(`✗ ${failures.length} assertion(s) failed`);
  process.exit(1);
}
console.log('✓ Website Onboarding data-layer contract test passed.');
process.exit(0);
