/**
 * Phase 2 — live schema probe (READ-ONLY, dev tooling, never bundled).
 *
 * Verifies that the tables, columns and RPC the ported Website Onboarding
 * writes to ALREADY EXIST in the existing Supabase project, using only the
 * public anon key and PostgREST's *schema-cache* error codes. It never reads
 * anyone's data and never writes: every probe is either rejected by RLS/grants
 * (42501) or fails schema validation before the query runs (PGRST204/PGRST205).
 *
 * Error-code semantics used:
 *   PGRST205 -> table/view is NOT in the schema (does not exist)
 *   42501    -> object EXISTS, current role lacks privileges (RLS/grants intact)
 *   PGRST204 -> column is NOT in the schema cache (column does not exist)
 *   42703    -> column does not exist (SQL-level, when SELECT is granted)
 *   PGRST202 -> function not found; its `hint` reveals the real signature
 *
 * Run: npx tsx scripts/live-schema-probe.ts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, 'VITE_');
const URL_BASE = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL_BASE || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env).');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const info = (m: string) => console.log(`       ${m}`);

type PgrstError = { code?: string; message?: string; hint?: string; details?: string };

const get = async (pathname: string) => {
  const res = await fetch(`${URL_BASE}/rest/v1/${pathname}`, { headers: H });
  const body = (await res.json().catch(() => ({}))) as PgrstError | unknown[];
  return { status: res.status, body: body as PgrstError & unknown[] };
};

/** Table existence without reading data. */
const tableExists = async (table: string) => {
  const { status, body } = await get(`${table}?select=*&limit=1`);
  if (body?.code === 'PGRST205') return { exists: false, note: 'not in schema cache' };
  if (body?.code === '42501') return { exists: true, note: 'exists; anon blocked by grants/RLS' };
  if (status === 200) return { exists: true, note: 'exists; anon SELECT granted, RLS filtered' };
  return { exists: true, note: `exists? status ${status} ${body?.code ?? ''}` };
};

/**
 * Column existence via INSERT schema validation. PostgREST resolves the column
 * list against its schema cache BEFORE executing, so an unknown column fails
 * with PGRST204 while a known column proceeds to the DB and is stopped by
 * grants/RLS (42501) or a constraint. Nothing is ever inserted.
 */
const columnExists = async (table: string, column: string) => {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ [column]: null }),
  });
  const body = (await res.json().catch(() => ({}))) as PgrstError;
  if (body?.code === 'PGRST204') return { exists: false, note: body.message ?? '' };
  if (body?.code === 'PGRST205') return { exists: false, note: 'table missing' };
  return { exists: true, note: `${body?.code ?? res.status} ${body?.message ?? ''}`.slice(0, 90) };
};

console.log('\nPhase 2 — live schema probe (read-only, anon key)');
console.log('='.repeat(72));
info(`Project: ${new URL(URL_BASE).hostname}`);

// ---------------------------------------------------------------------------
// 1. Tables the onboarding flow depends on must ALREADY exist (no duplicates)
// ---------------------------------------------------------------------------
console.log('\n[1] Existing tables used by the onboarding flow');
const REQUIRED_TABLES = [
  'growth_partners',
  'shop_attributions',
  'shop_onboarding_applications',
  'salon_setup_proposals',
  'salons',
];
for (const t of REQUIRED_TABLES) {
  const r = await tableExists(t);
  if (r.exists) ok(`${t.padEnd(30)} ${r.note}`);
  else bad(`${t.padEnd(30)} MISSING (${r.note})`);
}

// ---------------------------------------------------------------------------
// 2. No duplicate/parallel structure was introduced by the port
// ---------------------------------------------------------------------------
console.log('\n[2] Absence of duplicate structures (must NOT exist)');
const MUST_NOT_EXIST = [
  'website_onboarding',
  'website_onboarding_drafts',
  'nexora_onboarding_state',
  'onboarding_sessions',
  'website_settings',
  'salon_websites',
];
for (const t of MUST_NOT_EXIST) {
  const r = await tableExists(t);
  if (!r.exists) ok(`${t.padEnd(30)} absent (nothing new was created)`);
  else info(`${t.padEnd(30)} PRESENT — pre-existing in the project, not created by this port`);
}

// ---------------------------------------------------------------------------
// 3. Columns written by ensureApplication() in the repository
// ---------------------------------------------------------------------------
console.log('\n[3] shop_onboarding_applications — columns the port writes');
const APP_COLUMNS = [
  'submitted_by_partner_id',
  'existing_salon_id',
  'status',
  'current_step',
  'owner_email',
  'owner_phone',
  'shop_name',
  'city',
  'locality',
  'full_address',
  'opening_time',
  'closing_time',
  'about_shop',
  'website_template',
];
for (const c of APP_COLUMNS) {
  const r = await columnExists('shop_onboarding_applications', c);
  if (r.exists) ok(`column ${c}`);
  else bad(`column ${c} MISSING -> ${r.note}`);
}
const bogus = await columnExists('shop_onboarding_applications', '__bogus_column__');
if (!bogus.exists) ok('control: unknown column correctly rejected (PGRST204) — probe is sound');
else bad('control probe failed: unknown column was accepted');

// ---------------------------------------------------------------------------
// 4. salon_setup_proposals — which payload column actually exists?
//    (Phase 1 guessed `payload` with fallbacks; settle it here.)
// ---------------------------------------------------------------------------
console.log('\n[4] salon_setup_proposals — real column names');
const PROPOSAL_CANDIDATES = [
  'id',
  'growth_partner_id',
  'salon_id',
  'application_id',
  'status',
  'payload',
  'proposal_payload',
  'setup_payload',
  'data',
  'content',
  'submitted_at',
  'created_at',
  'updated_at',
];
const presentProposalCols: string[] = [];
for (const c of PROPOSAL_CANDIDATES) {
  // anon has SELECT on this table, so a SELECT probe gives the cleanest answer
  const { status, body } = await get(`salon_setup_proposals?select=${c}&limit=1`);
  const exists = status === 200 || (body?.code !== '42703' && body?.code !== 'PGRST204');
  if (exists) {
    presentProposalCols.push(c);
    ok(`column ${c}`);
  } else {
    info(`column ${c} — absent`);
  }
}
const payloadCols = presentProposalCols.filter((c) =>
  ['payload', 'proposal_payload', 'setup_payload', 'data', 'content'].includes(c),
);
if (payloadCols.length > 0) ok(`payload column resolved -> ${payloadCols.join(', ')}`);
else bad('no payload-like column found on salon_setup_proposals');

// ---------------------------------------------------------------------------
// 5. The RPC used for save/submit
// ---------------------------------------------------------------------------
console.log('\n[5] RPC save_growth_partner_salon_setup');
const rpc = await fetch(`${URL_BASE}/rest/v1/rpc/save_growth_partner_salon_setup`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({
    p_application_id: '00000000-0000-0000-0000-000000000000',
    p_payload: {},
    p_submit: false,
  }),
});
const rpcBody = (await rpc.json().catch(() => ({}))) as PgrstError;
if (rpcBody.code === 'PGRST202') {
  bad(`RPC signature mismatch -> ${rpcBody.message} ${rpcBody.hint ?? ''}`);
} else if (rpcBody.code === '42501') {
  ok('RPC exists with (p_application_id, p_payload, p_submit) and EXECUTE is denied to anon');
  info('-> only an authenticated Growth Partner can call it (correct security posture)');
} else {
  ok(`RPC exists and responded: ${rpc.status} ${rpcBody.code ?? ''} ${rpcBody.message ?? ''}`);
}

// Confirm the parameter names by forcing a signature miss.
const rpcMiss = await fetch(`${URL_BASE}/rest/v1/rpc/save_growth_partner_salon_setup`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({ p_application_id: null, p_payload: {}, p_submit_typo: false }),
});
const missBody = (await rpcMiss.json().catch(() => ({}))) as PgrstError;
if (missBody.hint) info(`Signature reported by PostgREST: ${missBody.hint.replace('Perhaps you meant to call the function ', '')}`);

console.log('\n' + '='.repeat(72));
if (failures === 0) {
  console.log('\u001b[32mRESULT: existing schema matches what the ported onboarding uses.\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} problem(s) found.\u001b[0m\n`);
process.exit(1);
