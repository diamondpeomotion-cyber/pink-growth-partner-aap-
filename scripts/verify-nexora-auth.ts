/**
 * Offline verification of the Nexora auth architecture (dev tooling, never
 * bundled).
 *
 *   npx tsx scripts/verify-nexora-auth.ts
 *
 * Asserts, without any credentials:
 *   1. The locked auth config is EXACTLY the Nexora contract
 *      (storageKey 'nexora.auth.qwaehqsmodekbgvnaavz', persistSession,
 *      autoRefreshToken, detectSessionInUrl, flowType 'pkce').
 *   2. Config validation rejects wrong projects / http / service-role keys
 *      and accepts the approved project with a browser-safe anon key.
 *   3. There is a SINGLE supabase client: the legacy import path
 *      (lib/supabaseClient) re-exports the same instance as lib/supabase.
 *   4. The /auth/login redirect helpers are idempotent and loop-free.
 *   5. Legacy-session storage migration moves a session into the shared key
 *      and removes the old slot (one-way, no resurrection).
 *
 * Live checks (PKCE/persist/logout against the real project) additionally run
 * when a .env with VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY exists and
 * GP_TEST_EMAIL/GP_TEST_PASSWORD are provided — see scripts/README.md.
 */

import { JSDOM } from 'jsdom';
import { loadEnv } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const info = (m: string) => console.log(`       ${m}`);
const assert = (cond: unknown, msg: string) => (cond ? ok(msg) : bad(msg));

console.log('\nNexora auth architecture — offline verification');
console.log('='.repeat(64));

// ---------------------------------------------------------------------------
// 1. Locked auth config
// ---------------------------------------------------------------------------
console.log('\n[1] Locked Nexora auth config (src/lib/supabase.ts)');
const { NEXORA_AUTH_OPTIONS, NEXORA_AUTH_STORAGE_KEY, supabase: appSupabase } = await import(
  '../src/lib/supabase'
);
assert(
  NEXORA_AUTH_STORAGE_KEY === 'nexora.auth.qwaehqsmodekbgvnaavz',
  `storageKey is 'nexora.auth.qwaehqsmodekbgvnaavz'`,
);
assert(NEXORA_AUTH_OPTIONS.storageKey === 'nexora.auth.qwaehqsmodekbgvnaavz', 'storageKey pinned in options');
assert(NEXORA_AUTH_OPTIONS.persistSession === true, 'persistSession === true');
assert(NEXORA_AUTH_OPTIONS.autoRefreshToken === true, 'autoRefreshToken === true');
assert(NEXORA_AUTH_OPTIONS.detectSessionInUrl === true, 'detectSessionInUrl === true');
assert(NEXORA_AUTH_OPTIONS.flowType === 'pkce', "flowType === 'pkce' (no implicit downgrade)");

// ---------------------------------------------------------------------------
// 2. Config validation (no real keys involved — synthetic JWT payloads only)
// ---------------------------------------------------------------------------
console.log('\n[2] validateSupabaseConfig()');
const { validateSupabaseConfig } = await import('../src/lib/supabase');

const b64url = (obj: unknown) =>
  Buffer.from(JSON.stringify(obj)).toString('base64url');
const fakeJwt = (role: string) =>
  `${b64url({ alg: 'HS256' })}.${b64url({ role, iss: 'supabase', ref: 'qwaehqsmodekbgvnaavz' })}.fakesig`;
const GOOD_URL = 'https://qwaehqsmodekbgvnaavz.supabase.co';

assert(
  validateSupabaseConfig(GOOD_URL, fakeJwt('anon')).isValid,
  'approved project URL + anon-shaped key accepted',
);
assert(
  !validateSupabaseConfig('https://otherproject.supabase.co', fakeJwt('anon')).isValid,
  'different project rejected',
);
assert(
  !validateSupabaseConfig('http://qwaehqsmodekbgvnaavz.supabase.co', fakeJwt('anon')).isValid,
  'http:// rejected',
);
assert(
  !validateSupabaseConfig(GOOD_URL, fakeJwt('service_role')).isValid,
  'service_role JWT rejected (no service role keys)',
);
assert(
  !validateSupabaseConfig(GOOD_URL, 'sb_secret_x').isValid,
  'sb_secret_ key rejected',
);
assert(
  !validateSupabaseConfig(GOOD_URL, 'not-a-key').isValid,
  'malformed key rejected',
);
assert(!validateSupabaseConfig(GOOD_URL, undefined).isValid, 'missing key rejected');
assert(
  validateSupabaseConfig(GOOD_URL, 'sb_publishable_x').isValid,
  'publishable (sb_publishable_) key accepted',
);

// ---------------------------------------------------------------------------
// 3. Single client — no second auth system
// ---------------------------------------------------------------------------
console.log('\n[3] Single client (lib/supabaseClient re-exports lib/supabase)');
const compat = await import('../src/lib/supabaseClient');
assert(
  compat.supabase === appSupabase,
  'lib/supabaseClient.supabase === lib/supabase.supabase (one client)',
);
assert(
  compat.NEXORA_AUTH_OPTIONS === NEXORA_AUTH_OPTIONS,
  'auth options object shared (same module, same contract)',
);
assert(
  compat.buildNexoraClient === (await import('../src/lib/supabase')).buildNexoraClient,
  'buildNexoraClient factory re-exported',
);

// ---------------------------------------------------------------------------
// 4. /auth/login redirect helpers — idempotent, loop-free
// ---------------------------------------------------------------------------
console.log('\n[4] authRedirect — redirect to /auth/login without loops');
const { redirectToLogin, restoreFromLogin, AUTH_LOGIN_PATH, isLoginPath } = await import(
  '../src/lib/authRedirect'
);
const makeBrowser = (pathname: string) => {
  const calls: string[] = [];
  return {
    location: { pathname },
    history: { replaceState: (_d: unknown, _u: string, url?: string | URL | null) => void calls.push(String(url)) },
    calls,
  };
};

const b1 = makeBrowser('/');
redirectToLogin(b1);
assert(b1.location.pathname === '/', 'redirectToLogin does not mutate location mock');
assert(b1.calls.length === 1 && b1.calls[0] === AUTH_LOGIN_PATH, 'signed-out on / -> replaceState to /auth/login');

const b2 = makeBrowser(AUTH_LOGIN_PATH);
redirectToLogin(b2);
assert(b2.calls.length === 0, 'already on /auth/login -> no-op (no loop)');

const b3 = makeBrowser(AUTH_LOGIN_PATH);
redirectToLogin(b3);
redirectToLogin(b3);
redirectToLogin(b3);
assert(b3.calls.length === 0, 'repeated redirects stay no-ops');

const b4 = makeBrowser('/auth/login');
restoreFromLogin(b4);
assert(b4.calls.length === 1 && b4.calls[0] === '/', 'signed-in on /auth/login -> restore to /');

const b5 = makeBrowser('/');
restoreFromLogin(b5);
assert(b5.calls.length === 0, 'signed-in on / -> no-op');

const b6 = makeBrowser('/some/deep/link');
redirectToLogin(b6);
assert(b6.calls.length === 1, 'deep link signed-out -> single replaceState');

assert(isLoginPath('/auth/login') && isLoginPath('/auth/login/') && !isLoginPath('/auth/other'), 'isLoginPath classification');

// ---------------------------------------------------------------------------
// 5. Legacy session storage migration (jsdom, one-way)
// ---------------------------------------------------------------------------
console.log('\n[5] Legacy storage migration');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.local/' });
const win = dom.window as unknown as Window & typeof globalThis;
const storage = win.localStorage;
const legacyKey = 'sb-qwaehqsmodekbgvnaavz-auth-token';
const legacySession = { access_token: 'at', refresh_token: 'rt', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1' } };
storage.setItem(legacyKey, JSON.stringify(legacySession));
storage.setItem(NEXORA_AUTH_STORAGE_KEY, '');
storage.removeItem(NEXORA_AUTH_STORAGE_KEY);

const g = globalThis as Record<string, unknown>;
const prevWindow = g.window;
const prevLocalStorage = g.localStorage;
g.window = win;
g.localStorage = storage;
try {
  const { migrateLegacySessionStorage } = await import('../src/lib/supabase');
  migrateLegacySessionStorage();
  const migrated = storage.getItem(NEXORA_AUTH_STORAGE_KEY);
  assert(Boolean(migrated), 'legacy session copied into the Nexora shared key');
  assert(
    migrated === JSON.stringify(legacySession) || (() => { try { return (JSON.parse(migrated ?? '') as Record<string, unknown>).access_token === 'at'; } catch { return false; } })(),
    'migrated payload is the legacy session itself',
  );
  assert(storage.getItem(legacyKey) === null, 'legacy slot removed (no resurrection risk)');
  migrateLegacySessionStorage();
  assert(storage.getItem(NEXORA_AUTH_STORAGE_KEY) !== null, 're-run is a no-op while target exists');
  // clearAllAuthStorage wipes both slots
  const { clearAllAuthStorage } = await import('../src/lib/supabase');
  clearAllAuthStorage();
  assert(
    storage.getItem(NEXORA_AUTH_STORAGE_KEY) === null && storage.getItem(legacyKey) === null,
    'clearAllAuthStorage wipes Nexora + legacy slots',
  );
} finally {
  if (prevWindow === undefined) delete g.window; else g.window = prevWindow;
  if (prevLocalStorage === undefined) delete g.localStorage; else g.localStorage = prevLocalStorage;
}

// ---------------------------------------------------------------------------
// 6. Optional live checks (only with real env + test credentials)
// ---------------------------------------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, 'VITE_');
const LIVE_URL = env.VITE_SUPABASE_URL;
const LIVE_KEY = env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.GP_TEST_EMAIL;
const TEST_PASSWORD = process.env.GP_TEST_PASSWORD;

if (LIVE_URL && LIVE_KEY) {
  console.log('\n[6] Live checks (real project, anon key present)');
  if (typeof globalThis.WebSocket === 'undefined') {
    const { WebSocket } = await import('ws');
    (globalThis as unknown as { WebSocket?: unknown }).WebSocket = WebSocket;
  }
  const { buildNexoraClient } = await import('../src/lib/supabase');
  const client = buildNexoraClient(LIVE_URL, LIVE_KEY);
  const { data, error } = await client.auth.getSession();
  assert(!error, 'getSession() resolves against the live project');
  assert(data.session === null, 'fresh client starts signed-out (no phantom session)');
  if (TEST_EMAIL && TEST_PASSWORD) {
    const signedIn = await client.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    assert(!signedIn.error && Boolean(signedIn.data.session), 'signInWithPassword succeeds (grant under PKCE client)');
    if (signedIn.data.session) {
      const { data: gotUser } = await client.auth.getUser();
      assert(Boolean(gotUser.user), 'getUser() validates the session server-side');
    }
    const out = await client.auth.signOut();
    assert(!out.error, 'signOut() succeeds');
    const after = await client.auth.getSession();
    assert(after.data.session === null, 'session cleared after signOut');
  } else {
    info('Set GP_TEST_EMAIL / GP_TEST_PASSWORD to extend with sign-in/out live checks.');
  }
} else {
  console.log('\n[6] Live checks skipped — no .env with VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY present.');
}

console.log('\n' + '='.repeat(64));
if (failures === 0) {
  console.log('\u001b[32mRESULT: Nexora auth architecture verified (offline assertions pass).\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} assertion(s) failed.\u001b[0m\n`);
process.exit(1);
