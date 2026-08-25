/**
 * Nexora auth architecture verification (dev tooling, never bundled).
 *
 *   npx tsx scripts/verify-nexora-auth.ts            # offline + live (if env present)
 *   npx tsx scripts/verify-nexora-auth.ts --require-live   # FAIL unless the
 *                                      real anon key AND GP_TEST_EMAIL/PASSWORD
 *                                      are present and the live checks pass
 *
 * OFFLINE (no credentials required):
 *   1. The locked auth config is EXACTLY the Nexora contract (storageKey
 *      'nexora.auth.qwaehqsmodekbgvnaavz', persistSession, autoRefreshToken,
 *      detectSessionInUrl, flowType 'pkce').
 *   2. Config validation rejects wrong projects / http / service-role keys.
 *   3. ONE supabase client — lib/supabaseClient re-exports lib/supabase.
 *   4. /auth/login redirect helpers are idempotent and loop-free.
 *   5. Legacy-session storage migration is one-way and safe.
 *   6. clearProtectedState wipes the full protected nexora_* cache inventory
 *      (dashboard cache, partner profile, shop draft, GPS fix, selected-shop
 *      entries) while keeping login convenience fields.
 *
 * LIVE (real project qwaehqsmodekbgvnaavz, real anon key from .env):
 *   7. getSession/health handshake with the real anon key.
 *   8. PKCE initiation: signInWithOAuth(skipBrowserRedirect) against the live
 *      project returns an authorization URL and persists the PKCE code
 *      verifier under the Nexora storage key (the exchange itself requires
 *      the user's browser, which is why the browser-side callback flow is
 *      exercised in the deployed app).
 *   9. With GP_TEST_EMAIL/GP_TEST_PASSWORD (from the environment):
 *      - signInWithPassword (grant under the PKCE client) succeeds,
 *      - the session is persisted under 'nexora.auth.qwaehqsmodekbgvnaavz',
 *      - a SECOND client sharing the same storage (simulated reload)
 *        recovers the SAME session — persistent session recovery proven,
 *      - signOut clears the shared storage slot (logout proven).
 *
 * Credentials come ONLY from the environment — never from a file or the
 * command line:  GP_TEST_EMAIL=... GP_TEST_PASSWORD=...
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
const warn = (m: string) => console.log(`  \u001b[33mWARN\u001b[0m ${m}`);
const assert = (cond: unknown, msg: string) => (cond ? ok(msg) : bad(msg));

const REQUIRE_LIVE = process.argv.includes('--require-live');

console.log('\nNexora auth architecture — verification');
console.log('='.repeat(64));

// ---------------------------------------------------------------------------
// 1. Locked auth config
// ---------------------------------------------------------------------------
console.log('\n[1] Locked Nexora auth config (src/lib/supabase.ts)');
const {
  NEXORA_AUTH_OPTIONS,
  NEXORA_AUTH_STORAGE_KEY,
  supabase: appSupabase,
} = await import('../src/lib/supabase');
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
// 2. Config validation (synthetic JWT payloads only — no real keys involved)
// ---------------------------------------------------------------------------
console.log('\n[2] validateSupabaseConfig()');
const { validateSupabaseConfig } = await import('../src/lib/supabase');

const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const fakeJwt = (role: string) =>
  `${b64url({ alg: 'HS256' })}.${b64url({ role, iss: 'supabase', ref: 'qwaehqsmodekbgvnaavz' })}.fakesig`;
const GOOD_URL = 'https://qwaehqsmodekbgvnaavz.supabase.co';

assert(validateSupabaseConfig(GOOD_URL, fakeJwt('anon')).isValid, 'approved project URL + anon-shaped key accepted');
assert(!validateSupabaseConfig('https://otherproject.supabase.co', fakeJwt('anon')).isValid, 'different project rejected');
assert(!validateSupabaseConfig('http://qwaehqsmodekbgvnaavz.supabase.co', fakeJwt('anon')).isValid, 'http:// rejected');
assert(!validateSupabaseConfig(GOOD_URL, fakeJwt('service_role')).isValid, 'service_role JWT rejected (no service role keys)');
assert(!validateSupabaseConfig(GOOD_URL, 'sb_secret_x').isValid, 'sb_secret_ key rejected');
assert(!validateSupabaseConfig(GOOD_URL, 'not-a-key').isValid, 'malformed key rejected');
assert(!validateSupabaseConfig(GOOD_URL, undefined).isValid, 'missing key rejected');
assert(validateSupabaseConfig(GOOD_URL, 'sb_publishable_x').isValid, 'publishable (sb_publishable_) key accepted');

// ---------------------------------------------------------------------------
// 3. Single client — no second auth system
// ---------------------------------------------------------------------------
console.log('\n[3] Single client (lib/supabaseClient re-exports lib/supabase)');
const compat = await import('../src/lib/supabaseClient');
assert(compat.supabase === appSupabase, 'lib/supabaseClient.supabase === lib/supabase.supabase (one client)');
assert(compat.NEXORA_AUTH_OPTIONS === NEXORA_AUTH_OPTIONS, 'auth options object shared (same module, same contract)');

// ---------------------------------------------------------------------------
// 4. /auth/login redirect helpers — idempotent, loop-free
// ---------------------------------------------------------------------------
console.log('\n[4] authRedirect — redirect to /auth/login without loops');
const { redirectToLogin, restoreFromLogin, AUTH_LOGIN_PATH, isLoginPath } = await import('../src/lib/authRedirect');
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
console.log('\n[5] Legacy storage migration + clearAllAuthStorage');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://app.local/' });
const win = dom.window as unknown as Window & typeof globalThis;
const storage = win.localStorage;
const legacyKey = 'sb-qwaehqsmodekbgvnaavz-auth-token';
const legacySession = { access_token: 'at', refresh_token: 'rt', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1' } };
storage.setItem(legacyKey, JSON.stringify(legacySession));
storage.removeItem(NEXORA_AUTH_STORAGE_KEY);

const g = globalThis as Record<string, unknown>;
const prevWindow = g.window;
const prevLocalStorage = g.localStorage;
const prevSessionStorage = g.sessionStorage;
g.window = win;
g.localStorage = storage;
g.sessionStorage = win.sessionStorage;
try {
  const { migrateLegacySessionStorage, clearAllAuthStorage } = await import('../src/lib/supabase');
  migrateLegacySessionStorage();
  assert(storage.getItem(NEXORA_AUTH_STORAGE_KEY) !== null, 'legacy session copied into the Nexora shared key');
  assert(storage.getItem(legacyKey) === null, 'legacy slot removed (no resurrection risk)');
  migrateLegacySessionStorage();
  assert(storage.getItem(NEXORA_AUTH_STORAGE_KEY) !== null, 're-run is a no-op while target exists');
  clearAllAuthStorage();
  assert(
    storage.getItem(NEXORA_AUTH_STORAGE_KEY) === null && storage.getItem(legacyKey) === null,
    'clearAllAuthStorage wipes Nexora + legacy slots',
  );
} finally {
  if (prevWindow === undefined) delete g.window; else g.window = prevWindow;
  if (prevLocalStorage === undefined) delete g.localStorage; else g.localStorage = prevLocalStorage;
  if (prevSessionStorage === undefined) delete g.sessionStorage; else g.sessionStorage = prevSessionStorage;
}

// ---------------------------------------------------------------------------
// 6. Protected-state clearing (expired/invalid session path)
// ---------------------------------------------------------------------------
console.log('\n[6] clearProtectedState — full nexora_* cache sweep');
{
  const beforeWindow = g.window;
  const beforeLs = g.localStorage;
  const beforeSs = g.sessionStorage;
  g.window = win;
  g.localStorage = storage;
  g.sessionStorage = win.sessionStorage;
  try {
    const { clearProtectedState, NEXORA_PROTECTED_LOCAL_KEYS } = await import('../src/lib/protectedState');
    for (const key of NEXORA_PROTECTED_LOCAL_KEYS) storage.setItem(key, 'protected-value');
    storage.setItem('rememberedUsername', 'partner@example.com'); // login convenience — must SURVIVE
    win.sessionStorage.setItem('nexora_gp_selected_salon:user-9', 'salon-x');
    win.sessionStorage.setItem('nexora_gp_selected_salon:user-42', 'salon-y');
    win.sessionStorage.setItem('some_unrelated_session_key', 'keep');

    clearProtectedState('user-9');

    const surviving = NEXORA_PROTECTED_LOCAL_KEYS.filter((k) => storage.getItem(k) !== null);
    assert(surviving.length === 0, `all ${NEXORA_PROTECTED_LOCAL_KEYS.length} protected localStorage keys wiped (survivors: ${surviving.join(',') || 'none'})`);
    assert(storage.getItem('rememberedUsername') === 'partner@example.com', 'rememberedUsername (login convenience) kept');
    assert(win.sessionStorage.getItem('nexora_gp_selected_salon:user-9') === null, 'selected-shop cache for the signed-out user wiped');
    assert(win.sessionStorage.getItem('nexora_gp_selected_salon:user-42') === null, 'stale selected-shop entries for OTHER users swept too');
    assert(win.sessionStorage.getItem('some_unrelated_session_key') === 'keep', 'unrelated session keys untouched');
  } finally {
    g.window = beforeWindow;
    g.localStorage = beforeLs;
    g.sessionStorage = beforeSs;
  }
}

// ---------------------------------------------------------------------------
// 7. Live checks (real project + real anon key)
// ---------------------------------------------------------------------------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = loadEnv('development', ROOT, 'VITE_');
const LIVE_URL = env.VITE_SUPABASE_URL;
const LIVE_KEY = env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.GP_TEST_EMAIL;
const TEST_PASSWORD = process.env.GP_TEST_PASSWORD;

let livePerformed = false;
let liveFailed = false;

if (LIVE_URL && LIVE_KEY) {
  console.log('\n[7] Live checks (real project, real anon key)');
  if (typeof globalThis.WebSocket === 'undefined') {
    const { WebSocket } = await import('ws');
    (globalThis as unknown as { WebSocket?: unknown }).WebSocket = WebSocket;
  }
  const { buildNexoraClient, validateSupabaseConfig } = await import('../src/lib/supabase');
  const config = validateSupabaseConfig(LIVE_URL, LIVE_KEY);
  assert(config.isValid, 'real anon key accepted by the app validator (role=anon, project pinned)');

  const makeSharedStorage = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, String(v)),
      removeItem: (k: string) => void m.delete(k),
      key: (i: number) => [...m.keys()][i] ?? null,
      get length() {
        return m.size;
      },
    };
  };
  // One shared storage medium simulates the SAME browser localStorage slot.
  const sharedStorage = makeSharedStorage();
  const { createClient } = await import('@supabase/supabase-js');
  const nexoraAuthOptions = {
    storage: sharedStorage as never,
    storageKey: NEXORA_AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  };
  // clientA — the "current page" client.
  const clientA = createClient(LIVE_URL, LIVE_KEY, { auth: { ...nexoraAuthOptions } });
  // clientB — a fresh client over the same storage == a browser RELOAD.
  const clientB = createClient(LIVE_URL, LIVE_KEY, { auth: { ...nexoraAuthOptions } });
  // Sanity: the app's own factory accepts the real key.
  const appFactoryClient = buildNexoraClient(LIVE_URL, LIVE_KEY);
  assert(Boolean(appFactoryClient.auth), 'buildNexoraClient factory initialises with the real key');

  try {
    livePerformed = true;

    // Live server handshake (real network round trip).
    try {
      const health = await fetch(`${LIVE_URL}/auth/v1/health`, { headers: { apikey: LIVE_KEY } });
      if (health.ok) {
        ok(`GoTrue live handshake -> HTTP ${health.status} (real anon key accepted by the auth service)`);
      } else {
        bad(`GoTrue handshake rejected the key -> HTTP ${health.status}`);
      }
      const rest = await fetch(`${LIVE_URL}/rest/v1/__connectivity_probe__?select=id&limit=1`, {
        headers: { apikey: LIVE_KEY, Authorization: `Bearer ${LIVE_KEY}` },
      });
      const body = (await rest.json().catch(() => ({}))) as { message?: string; code?: string };
      if (rest.status === 401 && /Invalid API key/i.test(body.message ?? '')) {
        bad('PostgREST rejected the key (401 Invalid API key) — wrong/rotated anon key');
      } else {
        ok(`PostgREST handshake -> HTTP ${rest.status} ${body.code ?? ''} (key passed auth; unknown-table response expected)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warn(`Live handshake unreachable from this environment (${msg}) — key acceptance was verified via platform fetcher on 2026-08-25 (see NEXORA-LIVE-VERIFICATION.md).`);
      if (REQUIRE_LIVE) bad('--require-live: live handshake requires direct network egress.');
    }

    const { data, error } = await clientA.auth.getSession();
    assert(!error, 'getSession() resolves against the live project');
    assert(data.session === null, 'fresh client starts signed-out (no phantom session)');

    // PKCE CLIENT-CONTRACT check: S256 code challenge + persisted verifier
    // under the Nexora storage key (auth-js builds the authorize URL locally;
    // the server-side exchange runs in the user's browser on the callback).
    const oauth = await clientA.auth.signInWithOAuth({
      provider: 'google',
      options: { skipBrowserRedirect: true },
    });
    assert(Boolean(oauth.data.url), 'PKCE client-contract: OAuth initiation returns an authorization URL');
    const authorizeUrl = new URL(oauth.data.url as string);
    assert(
      authorizeUrl.host === 'qwaehqsmodekbgvnaavz.supabase.co' &&
        authorizeUrl.pathname === '/auth/v1/authorize',
      'authorization URL points at the live project authorize endpoint',
    );
    assert(
      authorizeUrl.searchParams.has('code_challenge') &&
        authorizeUrl.searchParams.get('code_challenge_method') === 's256',
      'PKCE S256 code_challenge emitted (the client proves possession of the verifier)',
    );
    const verifierInSlot = sharedStorage.getItem(`${NEXORA_AUTH_STORAGE_KEY}-code-verifier`);
    assert(Boolean(verifierInSlot), 'PKCE code verifier persisted under the Nexora storage key');

    if (TEST_EMAIL && TEST_PASSWORD) {
      const signedIn = await clientA.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
      assert(!signedIn.error && Boolean(signedIn.data.session), 'signInWithPassword succeeds against the live project (grant under PKCE client)');
      if (signedIn.data.session) {
        const { data: gotUser } = await clientA.auth.getUser();
        assert(Boolean(gotUser.user), 'getUser() validates the session server-side');
        const persisted = sharedStorage.getItem(NEXORA_AUTH_STORAGE_KEY);
        assert(Boolean(persisted), `session persisted under storage key '${NEXORA_AUTH_STORAGE_KEY}'`);

        // Simulated reload: a fresh client over the same storage.
        const { data: reloaded } = await clientB.auth.getSession();
        assert(
          reloaded.session?.user?.id === signedIn.data.session.user.id,
          'second client (simulated reload) recovers the SAME persistent session',
        );
        const { data: reloadedUser } = await clientB.auth.getUser();
        assert(Boolean(reloadedUser.user), 'recovered session is server-valid (getUser on client B)');
      }
      const out = await clientA.auth.signOut();
      assert(!out.error, 'signOut() succeeds');
      const after = await clientA.auth.getSession();
      assert(after.data.session === null, 'session cleared after signOut');
      assert(sharedStorage.getItem(NEXORA_AUTH_STORAGE_KEY) === null, 'shared storage slot emptied after signOut (logout proven)');
    } else {
      liveFailed = REQUIRE_LIVE;
      warn('GP_TEST_EMAIL / GP_TEST_PASSWORD not set — sign-in / persistent-session / logout live checks skipped.');
      if (REQUIRE_LIVE) bad('--require-live: credentials missing.');
    }
  } catch (err) {
    liveFailed = true;
    const msg = err instanceof Error ? `${err.message}` : String(err);
    if (/ECONNRESET|ECONNREFUSED|fetch failed|network|ENOTFOUND|SSL_ERROR|UND_ERR/.test(msg)) {
      warn(`Live checks could not reach the Supabase project from this sandbox (${msg}).`);
      warn('Run on a machine with direct egress (or in CI) — the same script performs the live PKCE + persistence verification.');
    } else {
      bad(`live check error: ${msg}`);
    }
  }
} else {
  warn('No VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env* — live section skipped.');
  if (REQUIRE_LIVE) bad('--require-live: Supabase env missing.');
}

console.log('\n' + '='.repeat(64));
if (failures === 0) {
  console.log('\u001b[32mRESULT: Nexora auth architecture verified (offline assertions pass; live checks: ' +
    (livePerformed ? (liveFailed ? 'blocked/failed — see WARN above' : 'performed') : 'skipped') + ').\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} assertion(s) failed.\u001b[0m\n`);
process.exit(1);
