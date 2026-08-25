/**
 * Live probe of the Nexora location-sync schema on the shared project
 * qwaehqsmodekbgvnaavz (dev tooling, never bundled).
 *
 *   npx tsx scripts/probe-location-schema.ts            # read-only
 *   npx tsx scripts/probe-location-schema.ts --strict   # exit 1 on any failure
 *   GP_TEST_EMAIL=... GP_TEST_PASSWORD=... \
 *     npx tsx scripts/probe-location-schema.ts --write  # authenticated round-trip
 *
 * READ-ONLY checks (anon key only, no session):
 *   1. public.user_private_locations exists and ALL canonical Phase-7 columns
 *      resolve in the PostgREST schema cache.
 *   2. Anonymous reads/writes on the private location table are DENIED
 *      (the migration revokes anon; RLS scopes authenticated access to
 *      user_id = auth.uid()).
 *   3. RPC save_my_private_location exists (parameterized) and
 *      clear_my_private_location exists with EXECUTE denied to anon.
 *   4. Legacy targets: user_locations shape (user_id/latitude/longitude),
 *      salons anon grants (post-hardening denial).
 *
 * AUTHENTICATED checks (--write only, requires GP test credentials):
 *   5. Sign in with the GP test account (password grant under the PKCE
 *      client), read the user's own row (loadOwnLocation), save a location
 *      via save_my_private_location (identity from auth.uid()), re-read it,
 *      and RESTORE the previous row state afterwards. No other data is
 *      touched; every write goes through the authenticated user JWT + RLS.
 *
 * Methodology mirrors scripts/live-schema-probe.ts: error-code semantics —
 *   PGRST205 → table/object not in schema cache (does not exist)
 *   42501    → object EXISTS, current role lacks privileges
 *   PGRST202 → function EXISTS but signature differs (zero-param probe)
 *   PGRST204 / 42703 → column does not exist
 *   PGRST202+PARAMS → RPC callable only by privileged roles
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnv } from 'vite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, 'VITE_');
const URL_BASE = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

const STRICT = process.argv.includes('--strict');
const DO_WRITE = process.argv.includes('--write');

let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const warn = (m: string) => console.log(`  \u001b[33mWARN\u001b[0m ${m}`);
const info = (m: string) => console.log(`       ${m}`);

if (!URL_BASE || !KEY) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.local).');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

type PgrstError = { code?: string; message?: string; hint?: string; details?: string };

const get = async (pathname: string) => {
  const res = await fetch(`${URL_BASE}/rest/v1/${pathname}`, { headers: H });
  const body = (await res.json().catch(() => ({}))) as PgrstError | unknown[];
  return { status: res.status, body: body as PgrstError & unknown[] };
};

const post = async (pathname: string, payload: unknown, prefer = 'return=minimal') => {
  const res = await fetch(`${URL_BASE}/rest/v1/${pathname}`, {
    method: 'POST',
    headers: { ...H, Prefer: prefer },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as PgrstError;
  return { status: res.status, body };
};

console.log('\nNexora location-sync schema probe (live project)');
console.log('='.repeat(72));
info(`Project: ${new URL(URL_BASE).hostname}`);

// ---------------------------------------------------------------------------
console.log('\n[1] public.user_private_locations — canonical columns');
const CANONICAL_COLUMNS = [
  'user_id',
  'latitude',
  'longitude',
  'accuracy_m',
  'altitude_m',
  'altitude_accuracy_m',
  'speed_mps',
  'heading_degrees',
  'captured_at',
  'updated_at',
];
{
  let reachable = true;
  const probe = await get(`user_private_locations?select=${CANONICAL_COLUMNS.join(',')}&limit=1`).catch((err) => {
    reachable = false;
    return { status: 0, body: { message: String(err) } as PgrstError };
  });
  if (!reachable) {
    warn('Project unreachable from this environment (no direct egress).');
    warn('Live schema facts for this repo are recorded in NEXORA-LIVE-VERIFICATION.md (fetched 2026-08-25).');
    if (STRICT) bad('--strict: live probe requires direct network egress.');
    console.log('='.repeat(72));
    console.log(failures === 0 ? '\u001b[32mRESULT: probe skipped (network blocked; see report).\u001b[0m' : `\u001b[31mRESULT: ${failures} failure(s).\u001b[0m`);
    process.exit(failures === 0 ? 0 : 1);
  }
  const { status, body } = probe;
  if (body?.code === 'PGRST205') {
    bad('user_private_locations MISSING from the live project');
  } else if (body?.code === '42501') {
    ok('user_private_locations EXISTS and anon SELECT is DENIED (canonical revoke-all posture)');
    ok(`all ${CANONICAL_COLUMNS.length} canonical columns resolve in the schema cache (42501 after column resolution)`);
  } else if (status === 200) {
    ok('user_private_locations EXISTS (anon SELECT granted — verify RLS filters rows, not grants)');
  } else {
    bad(`unexpected response ${status}: ${body?.code ?? ''} ${body?.message ?? ''}`);
  }
  // Control: an unknown column must be REJECTED at the schema cache level.
  const control = await get(`user_private_locations?select=__bogus_col__&limit=1`).catch(() => ({
    status: 0,
    body: {} as PgrstError,
  }));
  if (control.body?.code === '42703' || control.body?.code === 'PGRST204') {
    ok('control probe: unknown column rejected (42703/PGRST204) — column check is sound');
  } else {
    warn(`control probe returned ${control.status} ${control.body?.code ?? ''} — column-check calibration unknown`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n[2] Anonymous writes are rejected (RLS + revoked anon grants)');
{
  const attempt = await post('user_private_locations', {
    user_id: '00000000-0000-0000-0000-000000000000',
    latitude: 0.000001,
    longitude: 0.000001,
    accuracy_m: 30,
    captured_at: new Date().toISOString(),
  }).catch((err) => ({ status: 0, body: { message: String(err) } as PgrstError }));
  if (attempt.status === 401 || attempt.status === 403 || attempt.body?.code === '42501') {
    ok(`anonymous INSERT rejected (HTTP ${attempt.status}/${attempt.body?.code ?? 'n/a'}) — no anonymous location writes`);
  } else if (attempt.body?.code === 'PGRST205') {
    bad('table missing — anonymous INSERT reached an empty schema');
  } else {
    bad(`anonymous INSERT NOT rejected (HTTP ${attempt.status} ${attempt.body?.code ?? ''} ${attempt.body?.message ?? ''}) — security posture unexpected`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n[3] Canonical RPCs');
{
  // Zero-parameter probe: PGRST202 = a parameterized function of that name
  // exists in the schema cache.
  const save = await get('rpc/save_my_private_location').catch(() => ({ status: 0, body: {} as PgrstError }));
  if (save.body?.code === 'PGRST202' && /without parameters/.test(save.body?.message ?? '')) {
    ok('save_my_private_location EXISTS (parameterized — PGRST202 for the zero-param signature)');
  } else if (save.body?.code === 'PGRST202') {
    warn(`save_my_private_location found with unexpected signature message: ${save.body?.message ?? ''}`);
  } else {
    bad(`save_my_private_location NOT confirmed (HTTP ${save.status} ${save.body?.code ?? ''} ${save.body?.message ?? ''})`);
  }
  const clear = await get('rpc/clear_my_private_location').catch(() => ({ status: 0, body: {} as PgrstError }));
  if (clear.body?.code === '42501') {
    ok('clear_my_private_location EXISTS and EXECUTE is denied to anon (correct security posture)');
  } else {
    warn(`clear_my_private_location: HTTP ${clear.status} ${clear.body?.code ?? ''} ${clear.body?.message ?? ''}`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n[4] Legacy/related targets');
{
  const legacy = await get('user_locations?select=user_id,latitude,longitude&limit=1').catch(() => ({
    status: 0,
    body: {} as PgrstError,
  }));
  if (legacy.body?.code === '42501') {
    ok('user_locations EXISTS (user_id/latitude/longitude resolve) — legacy fallback available, anon denied');
  } else if (legacy.body?.code === 'PGRST205') {
    info('user_locations absent — legacy fallback would be skipped');
  } else {
    info(`user_locations: HTTP ${legacy.status} ${legacy.body?.code ?? ''}`);
  }
  const legacyAccuracy = await get('user_locations?select=accuracy_m&limit=1').catch(() => ({
    status: 0,
    body: {} as PgrstError,
  }));
  if (legacyAccuracy.body?.code === '42703' || legacyAccuracy.body?.code === 'PGRST204') {
    ok('user_locations.accuracy_m absent — legacy table does NOT match the canonical shape (repository would skip it)');
  } else {
    info(`user_locations.accuracy_m: HTTP ${legacyAccuracy.status} ${legacyAccuracy.body?.code ?? ''} (may exist)`);
  }
  const salons = await get('salons?select=latitude,longitude&limit=1').catch(() => ({ status: 0, body: {} as PgrstError }));
  if (salons.body?.code === '42501') {
    ok('salons EXISTS but broad anon grants removed (post-Phase-7 hardening active)');
  } else if (salons.status === 200) {
    ok('salons EXISTS (anon catalog access granted)');
  } else {
    info(`salons: HTTP ${salons.status} ${salons.body?.code ?? ''}`);
  }
}

// ---------------------------------------------------------------------------
// [5] Authenticated round-trip (--write only)
// ---------------------------------------------------------------------------
if (DO_WRITE) {
  console.log('\n[5] Authenticated location round-trip (GP test credentials)');
  const EMAIL = process.env.GP_TEST_EMAIL;
  const PASSWORD = process.env.GP_TEST_PASSWORD;
  if (!EMAIL || !PASSWORD) {
    bad('--write requires GP_TEST_EMAIL / GP_TEST_PASSWORD in the environment');
  } else {
    if (typeof globalThis.WebSocket === 'undefined') {
      const { WebSocket } = await import('ws');
      (globalThis as unknown as { WebSocket?: unknown }).WebSocket = WebSocket;
    }
    const { buildNexoraClient } = await import('../src/lib/supabase');
    const { loadOwnLocation, syncUserLocation, clearOwnLocation } = await import(
      '../src/lib/locationSyncRepository'
    );
    const client = buildNexoraClient(URL_BASE, KEY);
    const signedIn = await client.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (signedIn.error || !signedIn.data.session) {
      bad(`sign-in failed: ${signedIn.error?.message ?? 'no session'}`);
    } else {
      ok('authenticated with GP test account (password grant under the PKCE client)');
      const before = await loadOwnLocation(client);
      info(`previous saved row: ${before ? 'present' : 'none'}`);

      // Write a CANONICALLY-VALID probe fix, then verify, then restore.
      const probeFix = {
        latitude: 26.9124336,
        longitude: 75.7872709,
        accuracy: 30,
        timestamp: Date.now(),
      };
      const saved = await syncUserLocation(client, probeFix);
      if (saved.synced) {
        ok(`save_my_private_location accepted the write (target: ${saved.target})`);
        const after = await loadOwnLocation(client);
        if (after && Math.abs(after.latitude - probeFix.latitude) < 1e-6) {
          ok('re-read own row matches the saved fix (RLS read-back, auth.uid() scoping)');
        } else {
          bad('re-read after save did not match (RLS or row-state issue)');
        }
      } else {
        bad(`save failed: ${saved.reason ?? 'unknown'}`);
      }

      // Restore previous state (best-effort, own row only).
      if (before) {
        const restored = await syncUserLocation(client, before);
        info(restored.synced ? 'previous row restored' : `restore failed: ${restored.reason ?? 'unknown'}`);
      } else {
        await clearOwnLocation(client);
        info('probe row cleared (no previous row existed)');
      }
      const out = await client.auth.signOut();
      ok(!out.error, 'sign-out after probe');
    }
  }
} else {
  console.log('\n[5] Authenticated round-trip skipped (pass --write with GP credentials to run)');
}

console.log('\n' + '='.repeat(72));
if (failures === 0) {
  console.log('\u001b[32mRESULT: location schema probe passed.\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} failure(s).\u001b[0m\n`);
process.exit(1);
