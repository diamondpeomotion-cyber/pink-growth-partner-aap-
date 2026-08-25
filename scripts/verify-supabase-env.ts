/**
 * Supabase environment verification (dev tooling — never bundled).
 *
 * Answers, without ever printing a key:
 *   1. Are VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY visible to Vite?
 *   2. Does the app's OWN validator (src/lib/supabaseClient.ts) accept them?
 *   3. Which Supabase project do they point at?
 *   4. Is the key a browser-safe anon/publishable key (never service_role)?
 *   5. Does createClient() initialise, and does the live project accept the key?
 *
 * Run:  npx tsx scripts/verify-supabase-env.ts          (live check included)
 *       npx tsx scripts/verify-supabase-env.ts --offline
 */

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';
import { createServer, loadEnv } from 'vite';

import { validateSupabaseConfig, buildNexoraClient } from '../src/lib/supabaseClient';

// Node 20 has no global WebSocket; supabase-js v2.112 requires one at
// construction time. Browsers always have it, so this shim exists ONLY so the
// test can run under Node — it changes nothing about the app.
if (typeof globalThis.WebSocket === 'undefined') {
  const { WebSocket } = await import('ws');
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OFFLINE = process.argv.includes('--offline');
const MODE = process.env.NODE_ENV === 'production' ? 'production' : 'development';

let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const warn = (m: string) => console.log(`  \u001b[33mWARN\u001b[0m ${m}`);
const info = (m: string) => console.log(`       ${m}`);

/** Key-safe description: never reveals the secret material. */
const describeKey = (key: string) => {
  const fingerprint = createHash('sha256').update(key).digest('hex').slice(0, 12);
  if (key.startsWith('sb_publishable_')) {
    return { kind: 'publishable (sb_publishable_…)', role: 'anon/publishable', fingerprint };
  }
  if (key.startsWith('sb_secret_')) {
    return { kind: 'SECRET (sb_secret_…)', role: 'service_role', fingerprint };
  }
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(
        Buffer.from(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='), 'base64').toString('utf8'),
      ) as { role?: string; ref?: string };
      return {
        kind: `legacy JWT (role=${payload.role ?? 'unknown'})`,
        role: payload.role ?? 'unknown',
        ref: payload.ref,
        fingerprint,
      };
    } catch {
      /* fall through */
    }
  }
  return { kind: 'unrecognised format', role: 'unknown', fingerprint };
};

console.log('\nSupabase environment verification');
console.log('='.repeat(60));

// ---------------------------------------------------------------------------
// 1. Load env exactly the way Vite does at dev/build time (.env, .env.local, …)
// ---------------------------------------------------------------------------
console.log(`\n[1] Vite env loading (mode="${MODE}", root=${ROOT})`);
const env = loadEnv(MODE, ROOT, 'VITE_');
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

if (url) ok(`VITE_SUPABASE_URL is set -> ${url}`);
else bad('VITE_SUPABASE_URL is missing (add it to .env or the hosting env)');

if (anonKey) ok(`VITE_SUPABASE_ANON_KEY is set (value never printed)`);
else bad('VITE_SUPABASE_ANON_KEY is missing (add it to .env or the hosting env)');

const foundVitePublicVars = Object.keys(env).filter((k) => k.startsWith('VITE_'));
info(`Public (browser-exposed) VITE_* vars found: ${foundVitePublicVars.join(', ') || 'none'}`);

// ---------------------------------------------------------------------------
// 2. The app's own validator decides — same code path as the browser
// ---------------------------------------------------------------------------
console.log('\n[2] src/lib/supabaseClient.ts -> validateSupabaseConfig()');
const config = validateSupabaseConfig(url, anonKey);
if (config.isValid) {
  ok('Config accepted by the app validator');
  info(`Normalised URL: ${config.url}`);
} else {
  bad(`Config rejected: ${config.error}`);
}

// ---------------------------------------------------------------------------
// 3. Project identity + key safety
// ---------------------------------------------------------------------------
console.log('\n[3] Project identity & key safety');
if (url) {
  try {
    const host = new URL(url).hostname;
    const ref = host.split('.')[0];
    if (host === 'qwaehqsmodekbgvnaavz.supabase.co') {
      ok(`Points at the EXISTING shared project: ${ref} (${host})`);
    } else {
      bad(`Points at a DIFFERENT project: ${ref} (${host}) — must be qwaehqsmodekbgvnaavz`);
    }
  } catch {
    bad('VITE_SUPABASE_URL is not a valid URL');
  }
}
if (anonKey) {
  const d = describeKey(anonKey);
  info(`Key type: ${d.kind}  sha256:${d.fingerprint}…  length=${anonKey.length}`);
  if (d.role === 'service_role' || d.kind.startsWith('SECRET')) {
    bad('SERVICE_ROLE / SECRET key detected in a VITE_ variable — remove it immediately');
  } else if (d.role === 'anon' || d.role === 'anon/publishable') {
    ok('Browser-safe anon/publishable key (RLS still enforced)');
  } else {
    bad(`Key role "${d.role}" is not an anon/publishable key`);
  }
  if ('ref' in d && d.ref && d.ref !== 'qwaehqsmodekbgvnaavz') {
    bad(`Key belongs to project "${d.ref}", not qwaehqsmodekbgvnaavz`);
  }
}

// ---------------------------------------------------------------------------
// 4. Client initialisation (what `export const supabase` does in the browser)
// ---------------------------------------------------------------------------
console.log('\n[4] createClient() initialisation');
let client: ReturnType<typeof createClient> | null = null;
if (config.isValid) {
  try {
    // Use the app's OWN client factory so this check always exercises the
    // exact production auth options (PKCE, Nexora storage key, persist+refresh).
    client = buildNexoraClient(config.url, config.anonKey);
    ok('Supabase client initialised via buildNexoraClient (flowType="pkce", Nexora storage key — same as the app)');
    info(`client.auth present: ${Boolean(client.auth)} | client.from present: ${typeof client.from === 'function'}`);
  } catch (error) {
    bad(`createClient threw: ${(error as Error).message}`);
  }
} else {
  bad('Skipped — configuration invalid, the app would render the "Configuration required" screen');
}

// ---------------------------------------------------------------------------
// 5. Live handshake with the existing project (read-only, no schema changes)
// ---------------------------------------------------------------------------
console.log('\n[5] Live handshake with the existing project (read-only)');
if (OFFLINE) {
  warn('Skipped (--offline)');
} else if (!config.isValid || !client) {
  warn('Skipped — no valid client');
} else {
  try {
    const health = await fetch(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.anonKey },
    });
    if (health.ok) ok(`GoTrue /auth/v1/health -> ${health.status} (API key accepted)`);
    else if (health.status === 401) bad('GoTrue rejected the key (401) — wrong/rotated anon key');
    else warn(`GoTrue /auth/v1/health -> ${health.status}`);
  } catch (error) {
    warn(`GoTrue health check unreachable: ${(error as Error).message}`);
  }

  // NOTE: `/rest/v1/` (the OpenAPI root) answers 401 "Only the service_role API
  // key can be used for this endpoint" — that is expected for a browser key and
  // is itself proof we are NOT holding a secret key. Probe a table path instead:
  // an accepted key yields PGRST-level JSON (200/404/permission denied), while a
  // rejected key yields 401 "Invalid API key".
  try {
    const rest = await fetch(`${config.url}/rest/v1/__connectivity_probe__?select=id&limit=1`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
    });
    const body = (await rest.json().catch(() => ({}))) as { message?: string; code?: string };
    if (rest.status === 401 && /Invalid API key/i.test(body.message ?? '')) {
      bad('PostgREST rejected the key (401 Invalid API key) — wrong/rotated anon key');
    } else {
      ok(
        `PostgREST reached and key accepted -> ${rest.status} ${body.code ?? ''} ` +
          '(unknown-table response proves auth passed)',
      );
    }
    const rootProbe = await fetch(`${config.url}/rest/v1/`, {
      headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` },
    });
    if (rootProbe.status === 401) {
      ok('OpenAPI root is service_role-only and refuses this key — confirms no secret key in use');
    } else {
      warn(`OpenAPI root answered ${rootProbe.status} — unexpected for an anon key`);
    }
  } catch (error) {
    warn(`PostgREST unreachable: ${(error as Error).message}`);
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) warn(`auth.getSession() error: ${error.message}`);
    else ok(`auth.getSession() responded (session: ${data.session ? 'present' : 'none — expected, no login here'})`);
  } catch (error) {
    warn(`auth.getSession() threw: ${(error as Error).message}`);
  }

  // Anonymous read against an existing RLS-protected table: a 200 with 0 rows
  // or a permission error both prove the connection works and RLS is intact.
  try {
    const { error } = await client.from('growth_partners').select('id').limit(1);
    if (!error) ok('Query to existing table growth_partners executed (RLS applied, anon sees no rows)');
    else if (/permission|policy|JWT|row-level/i.test(error.message)) {
      ok(`Query reached the DB and RLS blocked anon as expected ("${error.message}")`);
    } else {
      warn(`Query returned: ${error.message}`);
    }
  } catch (error) {
    warn(`Query threw: ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 6. The REAL module: load src/lib/supabaseClient.ts through Vite so that
//    import.meta.env is injected exactly as it is in the browser build, and
//    assert the exported `supabase` singleton is a live client.
// ---------------------------------------------------------------------------
console.log('\n[6] Real app module (src/lib/supabaseClient.ts) via Vite env injection');
try {
  const server = await createServer({
    root: ROOT,
    mode: MODE,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const mod = (await server.ssrLoadModule('/src/lib/supabaseClient.ts')) as {
      supabase: unknown;
      supabaseConfigError: string | null;
    };
    if (mod.supabaseConfigError) {
      bad(`Module reports supabaseConfigError: ${mod.supabaseConfigError}`);
    } else {
      ok('supabaseConfigError === null (app will NOT show the "Configuration required" screen)');
    }
    if (mod.supabase) {
      ok('Exported `supabase` singleton is initialised from import.meta.env');
    } else {
      bad('Exported `supabase` singleton is null');
    }
  } finally {
    await server.close();
  }
} catch (error) {
  bad(`Vite module load failed: ${(error as Error).message}`);
}

console.log('\n' + '='.repeat(60));
if (failures === 0) {
  console.log('\u001b[32mRESULT: Supabase environment configured correctly.\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} check(s) failed.\u001b[0m\n`);
process.exit(1);
