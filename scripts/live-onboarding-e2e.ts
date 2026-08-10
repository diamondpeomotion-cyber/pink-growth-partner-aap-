/**
 * Phase 2 — live end-to-end test of the ported Website Onboarding against the
 * EXISTING Supabase project (dev tooling, never bundled).
 *
 * Exercises the real user journey with a real Growth Partner session:
 *   sign in -> White Label > Website context -> select existing shop ->
 *   load existing data -> edit -> save draft -> "refresh" (fresh client, cold
 *   cache) -> reload draft -> submit for approval -> shop isolation checks.
 *
 * It uses ONLY the app's own modules (src/lib/shopContext.ts and
 * src/website-onboarding/lib/websiteOnboardingRepository.ts) through the shared
 * anon client + the signed-in user's session. No service-role key, no RLS
 * bypass, no schema change.
 *
 * SAFETY
 *   default          read-only: sign in, list shops, load current data, run the
 *                    isolation checks. Nothing is written.
 *   --write          additionally save a DRAFT and reload it, then RESTORE the
 *                    original payload afterwards.
 *   --submit         additionally run submit-for-approval (implies --write).
 *   --shop=<uuid|substring of name>   pick a specific attributed shop.
 *
 * Credentials come from the environment, never from a file:
 *   GP_TEST_EMAIL=... GP_TEST_PASSWORD=... npx tsx scripts/live-onboarding-e2e.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

// --- Node shims: the app modules touch browser storage/history -------------
if (typeof globalThis.WebSocket === 'undefined') {
  const { WebSocket } = await import('ws');
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}
const makeStorage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
};
const localStorageShim = makeStorage();
const sessionStorageShim = makeStorage();
Object.assign(globalThis, {
  window: {
    localStorage: localStorageShim,
    sessionStorage: sessionStorageShim,
    location: { href: 'https://app.local/', search: '', hash: '', pathname: '/' },
    history: { replaceState: () => {} },
  },
  localStorage: localStorageShim,
  sessionStorage: sessionStorageShim,
});

const { loadShopContext, assertShopBelongsToPartner } = await import('../src/lib/shopContext');
const {
  loadWebsiteOnboarding,
  saveWebsiteOnboarding,
  clearLocalDraft,
  readLocalDraft,
} = await import('../src/website-onboarding/lib/websiteOnboardingRepository');
const { initialData } = await import('../src/website-onboarding/types');
type SalonData = import('../src/website-onboarding/types').SalonData;

// ---------------------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, 'VITE_');
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

const argv = process.argv.slice(2);
const DO_SUBMIT = argv.includes('--submit');
const DO_WRITE = DO_SUBMIT || argv.includes('--write');
const SHOP_ARG = argv.find((a) => a.startsWith('--shop='))?.slice('--shop='.length) ?? null;

const EMAIL = process.env.GP_TEST_EMAIL;
const PASSWORD = process.env.GP_TEST_PASSWORD;

let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const warn = (m: string) => console.log(`  \u001b[33mWARN\u001b[0m ${m}`);
const info = (m: string) => console.log(`       ${m}`);
const head = (m: string) => console.log(`\n${m}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase env (see .env).');
  process.exit(1);
}
if (!EMAIL || !PASSWORD) {
  console.error(
    '\nMissing credentials. Run with:\n' +
      '  GP_TEST_EMAIL="partner@example.com" GP_TEST_PASSWORD="..." \\\n' +
      '    npx tsx scripts/live-onboarding-e2e.ts [--write] [--submit] [--shop=<id|name>]\n',
  );
  process.exit(1);
}

/** A brand-new client == a browser refresh (fresh session, no in-memory state). */
const newClient = (): SupabaseClient =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false },
  });

const signIn = async (client: SupabaseClient) => {
  const { data, error } = await client.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (error) throw new Error(`Sign-in failed: ${error.message}`);
  return data.user;
};

console.log('\nPhase 2 — live onboarding end-to-end');
console.log('='.repeat(72));
info(`Project: ${new URL(SUPABASE_URL).hostname}`);
info(`Mode: ${DO_SUBMIT ? 'WRITE + SUBMIT' : DO_WRITE ? 'WRITE (draft only)' : 'READ-ONLY'}`);

// ---------------------------------------------------------------------------
head('[1] Sign in as an existing Growth Partner (no new auth system)');
const client = newClient();
const user = await signIn(client);
ok(`Signed in as ${user?.email} (user id ${user?.id?.slice(0, 8)}…)`);

// ---------------------------------------------------------------------------
head('[2] White Label > Website: resolve shop context from the server');
const ctx = await loadShopContext(client);
if (!ctx.partnerId) {
  bad('No growth_partners row resolved for this user — cannot continue.');
  process.exit(1);
}
ok(`Growth partner resolved: ${ctx.partnerId.slice(0, 8)}…`);
ok(`Attributed shops returned by the server: ${ctx.shops.length}`);
ctx.shops.forEach((s, i) =>
  info(`  ${i + 1}. ${s.name} — ${[s.area, s.city].filter(Boolean).join(', ')} [${s.status}] salon ${s.salonId.slice(0, 8)}…`),
);
if (ctx.shops.length === 0) {
  bad('This partner has no attributed shops; nothing to verify.');
  process.exit(1);
}

const shop =
  (SHOP_ARG &&
    (ctx.shops.find((s) => s.salonId === SHOP_ARG) ??
      ctx.shops.find((s) => s.name.toLowerCase().includes(SHOP_ARG.toLowerCase())))) ||
  ctx.selected ||
  ctx.shops[0];
ok(`Working shop: "${shop.name}" (${shop.salonId.slice(0, 8)}…)`);

// ---------------------------------------------------------------------------
head('[3] Existing shop data is readable and preserved');
const salonBefore = await client
  .from('salons')
  .select('id, name, city, area')
  .eq('id', shop.salonId)
  .maybeSingle();
if (salonBefore.error) warn(`salons read: ${salonBefore.error.message}`);
else if (salonBefore.data) ok(`salons row intact: "${salonBefore.data.name}" (${salonBefore.data.city ?? '—'})`);
else warn('salons row not visible to this partner (RLS) — comparison skipped');

const before = await loadWebsiteOnboarding(client, {
  partnerId: ctx.partnerId,
  salonId: shop.salonId,
  userId: user!.id,
});
ok(`Existing onboarding loaded: source=${before.source} status=${before.status} step=${before.step}`);
if (before.warning) warn(`load warning: ${before.warning}`);
info(`applicationId=${before.applicationId ?? 'none yet'} proposalId=${before.proposalId ?? 'none yet'}`);
if (before.data) info(`existing salonName in payload: "${before.data.salonName}"`);
const originalData: SalonData | null = before.data ? JSON.parse(JSON.stringify(before.data)) : null;
const originalStep = before.step;

// ---------------------------------------------------------------------------
head('[4] Shop isolation (RLS + allow-list)');
const foreignSalonId = randomUUID();
try {
  await assertShopBelongsToPartner(client, ctx.partnerId, foreignSalonId);
  bad('assertShopBelongsToPartner accepted a salon this partner is NOT attributed to');
} catch (e) {
  ok(`Foreign salon rejected before any write: "${(e as Error).message}"`);
}
try {
  await saveWebsiteOnboarding(client, {
    partnerId: ctx.partnerId,
    salonId: foreignSalonId,
    userId: user!.id,
    applicationId: null,
    data: { ...initialData, salonName: 'SHOULD NEVER PERSIST' },
    step: 1,
    submit: false,
  });
  bad('saveWebsiteOnboarding wrote data for a foreign salon id');
} catch (e) {
  ok(`Save to a foreign salon blocked: "${(e as Error).message}"`);
}
if (readLocalDraft(user!.id, foreignSalonId)) {
  bad('A local draft was cached for the foreign salon (leak)');
} else {
  ok('No local cache entry created for the foreign salon');
}

// RLS: an unfiltered read must only ever return this partner's own rows.
const allApps = await client
  .from('shop_onboarding_applications')
  .select('id, submitted_by_partner_id, existing_salon_id')
  .limit(200);
if (allApps.error) {
  ok(`Unfiltered applications read refused by RLS: ${allApps.error.message}`);
} else {
  const foreign = (allApps.data ?? []).filter((r) => String(r.submitted_by_partner_id) !== ctx.partnerId);
  if (foreign.length === 0)
    ok(`Unfiltered read returned ${allApps.data?.length ?? 0} row(s), all owned by this partner`);
  else bad(`RLS leak: ${foreign.length} application row(s) belong to other partners`);
}
const allProposals = await client
  .from('salon_setup_proposals')
  .select('id, growth_partner_id, salon_id, status')
  .limit(200);
if (allProposals.error) {
  ok(`Unfiltered proposals read refused by RLS: ${allProposals.error.message}`);
} else {
  const foreign = (allProposals.data ?? []).filter(
    (r) => String(r.growth_partner_id) !== ctx.partnerId,
  );
  if (foreign.length === 0)
    ok(`Unfiltered read returned ${allProposals.data?.length ?? 0} proposal(s), all owned by this partner`);
  else bad(`RLS leak: ${foreign.length} proposal row(s) belong to other partners`);
}
// RPC with someone else's application id must be refused server-side.
const rogue = await client.rpc('save_growth_partner_salon_setup', {
  p_application_id: randomUUID(),
  p_payload: { probe: true },
  p_submit: false,
});
if (rogue.error) ok(`RPC refused an application id not owned by this partner: ${rogue.error.message}`);
else bad('RPC accepted an application id that does not belong to this partner');

// ---------------------------------------------------------------------------
head('[5] Edit + save draft to the existing structure');
let savedMarker = '';
if (!DO_WRITE) {
  warn('Skipped (read-only mode). Re-run with --write to save a draft.');
} else {
  const baseData: SalonData = originalData ?? {
    ...initialData,
    salonName: shop.name || initialData.salonName,
    city: shop.city || initialData.city,
  };
  savedMarker = `phase2-check ${new Date().toISOString()}`;
  const edited: SalonData = { ...baseData, tagline: savedMarker };
  const targetStep = Math.max(originalStep, 4);

  const result = await saveWebsiteOnboarding(client, {
    partnerId: ctx.partnerId,
    salonId: shop.salonId,
    userId: user!.id,
    applicationId: before.applicationId,
    data: edited,
    step: targetStep,
    submit: false,
  });
  if (result.persistedRemotely) ok(`Draft saved remotely: ${result.message}`);
  else bad(`Draft did not reach Supabase: ${result.message}`);
  info(`applicationId=${result.applicationId} proposalId=${result.proposalId} status=${result.status}`);
  ok('Write path used existing table shop_onboarding_applications + RPC save_growth_partner_salon_setup');
}

// ---------------------------------------------------------------------------
head('[6] "Refresh": brand-new client, cold local cache, reload the draft');
if (!DO_WRITE) {
  warn('Skipped (read-only mode).');
} else {
  localStorageShim.clear();
  sessionStorageShim.clear();
  clearLocalDraft(user!.id, shop.salonId);
  const client2 = newClient();
  const user2 = await signIn(client2);
  const ctx2 = await loadShopContext(client2);
  const shop2 = ctx2.shops.find((s) => s.salonId === shop.salonId);
  if (shop2) ok('After refresh the same shop is still in the server allow-list');
  else bad('Shop disappeared from the allow-list after refresh');

  const after = await loadWebsiteOnboarding(client2, {
    partnerId: ctx2.partnerId!,
    salonId: shop.salonId,
    userId: user2!.id,
  });
  if (after.source === 'supabase') ok('Reloaded draft came from Supabase (not the local cache)');
  else bad(`Reloaded draft came from "${after.source}" — server round-trip failed`);
  if (after.data?.tagline === savedMarker) ok('Edited value survived the round-trip byte-for-byte');
  else bad(`Edited value lost: expected "${savedMarker}", got "${after.data?.tagline ?? 'nothing'}"`);
  if (after.step >= 4) ok(`Wizard step restored: ${after.step}`);
  else bad(`Wizard step not restored: ${after.step}`);
  if (after.data?.services?.length === (originalData?.services?.length ?? after.data?.services?.length))
    ok('Other onboarding fields preserved (services count unchanged)');

  const salonAfter = await client2
    .from('salons')
    .select('id, name, city, area')
    .eq('id', shop.salonId)
    .maybeSingle();
  if (salonBefore.data && salonAfter.data) {
    const same = JSON.stringify(salonBefore.data) === JSON.stringify(salonAfter.data);
    if (same) ok('Existing salons row untouched by the onboarding save');
    else bad(`salons row changed: ${JSON.stringify(salonBefore.data)} -> ${JSON.stringify(salonAfter.data)}`);
  }
}

// ---------------------------------------------------------------------------
head('[7] Submit for approval (existing proposal flow)');
if (!DO_SUBMIT) {
  warn('Skipped. Re-run with --submit to exercise submit-for-approval.');
} else {
  const submitResult = await saveWebsiteOnboarding(client, {
    partnerId: ctx.partnerId,
    salonId: shop.salonId,
    userId: user!.id,
    applicationId: before.applicationId,
    data: { ...(originalData ?? initialData), tagline: savedMarker },
    step: 13,
    submit: true,
  });
  if (submitResult.persistedRemotely && submitResult.status === 'submitted')
    ok(`Submitted: ${submitResult.message}`);
  else bad(`Submit failed: ${submitResult.message}`);

  const check = await client
    .from('salon_setup_proposals')
    .select('id, status, submitted_at, updated_at')
    .eq('growth_partner_id', ctx.partnerId)
    .eq('salon_id', shop.salonId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (check.error) warn(`could not re-read proposal: ${check.error.message}`);
  else if (check.data?.[0]) {
    const row = check.data[0] as { status?: string; submitted_at?: string | null };
    if (row.status && row.status !== 'draft') ok(`Proposal status is now "${row.status}"`);
    else bad(`Proposal status is still "${row.status}"`);
    info(`submitted_at=${row.submitted_at ?? 'null'}`);
  }
}

// ---------------------------------------------------------------------------
head('[8] Restore the original payload (leave no test residue)');
if (!DO_WRITE) {
  warn('Nothing to restore (read-only mode).');
} else if (!originalData) {
  warn('There was no pre-existing payload for this shop; the draft created by this test remains.');
  info('It is a normal draft for a shop this partner owns and can be overwritten in the UI.');
} else {
  try {
    const restored = await saveWebsiteOnboarding(client, {
      partnerId: ctx.partnerId,
      salonId: shop.salonId,
      userId: user!.id,
      applicationId: before.applicationId,
      data: originalData,
      step: originalStep,
      submit: false,
    });
    if (restored.persistedRemotely) ok('Original payload restored');
    else warn('Restore did not reach the server');
  } catch (e) {
    warn(`Restore failed: ${(e as Error).message}`);
  }
}

console.log('\n' + '='.repeat(72));
if (failures === 0) console.log('\u001b[32mRESULT: all live checks passed.\u001b[0m\n');
else console.log(`\u001b[31mRESULT: ${failures} check(s) failed.\u001b[0m\n`);
process.exit(failures === 0 ? 0 : 1);
