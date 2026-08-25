/**
 * Offline lifecycle verification of the authenticated location sync hook
 * (dev tooling, never bundled).
 *
 *   npx tsx scripts/verify-location-sync.ts
 *
 * Renders src/hooks/useLocationSync.ts in jsdom against an in-memory fake of
 * supabase-js and a stubbed navigator.geolocation, and asserts:
 *   1. Disabled hook (signed-out) never starts a GPS watcher.
 *   2. Enabled hook WITHOUT a session never starts a watcher.
 *   3. Enabled hook WITH a session starts exactly ONE watcher (no duplicate
 *      watchers), even under React StrictMode double-mounting.
 *   4. An accepted fix (accuracy <= 30 m) is saved through the canonical
 *      RPC save_my_private_location — identity is derived from auth.uid()
 *      server-side, so the payload contains NO target user_id.
 *   5. When the canonical RPC is absent (PGRST202), the repository falls
 *      back to an RLS-gated upsert on user_private_locations carrying the
 *      VERIFIED (getUser) user id.
 *   6. The user's own saved row is restored from the backend on session
 *      start (loadOwnLocation) and never re-written back.
 *   7. SIGNED_OUT stops the watcher immediately (cleanup on logout).
 *   8. Unmount stops the watcher (cleanup on unmount).
 *
 * No network, no real project. Lives outside src/; nothing imports it.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://partner.nexora.test/',
  pretendToBeVisual: true,
});

const g = globalThis as unknown as Record<string, unknown>;
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
g.cancelAnimationFrame = (id: number) => clearTimeout(id);
g.localStorage = dom.window.localStorage;
g.sessionStorage = dom.window.sessionStorage;
g.IS_REACT_ACT_ENVIRONMENT = true;

// ---- Stubbed GPS layer (single source of truth for watcher counting) -----
const geoState = {
  watchCalls: 0,
  clearCalls: 0,
  activeWatches: new Set<number>(),
  successCb: null as ((pos: { coords: { latitude: number; longitude: number; accuracy: number }; timestamp: number }) => void) | null,
};
let nextWatchId = 1;
(dom.window.navigator as unknown as Record<string, unknown>).geolocation = {
  watchPosition: (success: (pos: unknown) => void, _error: (err: unknown) => void, _opts?: unknown) => {
    geoState.watchCalls += 1;
    const id = nextWatchId++;
    geoState.activeWatches.add(id);
    geoState.successCb = success as never;
    return id;
  },
  clearWatch: (id: number) => {
    geoState.clearCalls += 1;
    geoState.activeWatches.delete(id);
  },
};

// ---- Fake supabase-js client ----------------------------------------------
interface BackendCall {
  kind: 'rpc' | 'upsert';
  fn?: string;
  params?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  table?: string;
}
const backendCalls: BackendCall[] = [];
let unsubscribed = 0;

const makeFakeClient = (opts: {
  session: unknown;
  rpcError?: { code: string; message: string } | null;
  savedRow?: Record<string, unknown> | null;
  savedReads?: { count: number };
} = { session: null }) => {
  const listeners: Array<(event: string, session: unknown) => void> = [];
  const reads = opts.savedReads ?? { count: 0 };
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
      getSession: () => Promise.resolve({ data: { session: opts.session }, error: null }),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        listeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                unsubscribed += 1;
              },
            },
          },
        };
      },
      _emit: (event: string, session: unknown) => {
        for (const cb of listeners) cb(event, session);
      },
    },
    rpc: (fn: string, params: Record<string, unknown>) => {
      backendCalls.push({ kind: 'rpc', fn, params });
      return Promise.resolve(opts.rpcError ? { error: opts.rpcError, data: null } : { error: null, data: null });
    },
    from: (table: string) => {
      const api: Record<string, unknown> = {
        select: () => api,
        eq: () => api,
        maybeSingle: () => {
          reads.count += 1;
          return Promise.resolve({ data: opts.savedRow ?? null, error: null });
        },
        upsert: (payload: Record<string, unknown>) => {
          backendCalls.push({ kind: 'upsert', table, payload });
          return Promise.resolve({ error: null, data: null });
        },
        update: (payload: Record<string, unknown>) => ({
          eq: () => Promise.resolve({ error: null, data: null }),
          payload,
        }),
      };
      return api;
    },
  };
};

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act, StrictMode } = await import('react');
const { useLocationSync } = await import('../src/hooks/useLocationSync');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const ok = (m: string) => console.log(`  \u001b[32mPASS\u001b[0m ${m}`);
const bad = (m: string) => {
  failures += 1;
  console.log(`  \u001b[31mFAIL\u001b[0m ${m}`);
};
const assert = (cond: unknown, msg: string) => (cond ? ok(msg) : bad(msg));

const session = {
  user: { id: 'user-1' },
  access_token: 'at',
  refresh_token: 'rt',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

function Probe({ enabled, client }: { enabled: boolean; client: unknown }) {
  useLocationSync({ enabled, client: client as never });
  return React.createElement('div', null, 'probe');
}

const render = async (el: React.ReactElement, strict = false) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(strict ? React.createElement(StrictMode, null, el) : el);
    await sleep(25);
  });
  return {
    root,
    container,
    rerender: async (next: React.ReactElement) => {
      await act(async () => {
        root.render(next);
        await sleep(25);
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
        await sleep(10);
      });
    },
  };
};

const reset = () => {
  backendCalls.length = 0;
  geoState.watchCalls = 0;
  geoState.clearCalls = 0;
  geoState.activeWatches.clear();
  geoState.successCb = null;
  dom.window.localStorage.removeItem('nexora_last_accurate_fix');
};

console.log('\nAuthenticated location sync — offline lifecycle verification (canonical RPC)');
console.log('='.repeat(64));

// 1. Disabled hook — never starts a watcher
{
  reset();
  const client = makeFakeClient({ session });
  const { unmount } = await render(React.createElement(Probe, { enabled: false, client }));
  assert(geoState.watchCalls === 0, 'signed-out (enabled=false): GPS watcher never started');
  await unmount();
}

// 2. Enabled but NO session — never starts a watcher
{
  reset();
  const client = makeFakeClient({ session: null });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }));
  assert(geoState.watchCalls === 0, 'enabled but unauthenticated (no session): GPS watcher never started');
  await unmount();
}

// 3. Enabled + session → exactly one watcher; fix saved via canonical RPC
{
  reset();
  const client = makeFakeClient({ session });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }));
  assert(geoState.watchCalls === 1, 'authenticated: exactly ONE GPS watcher started');
  const fix = { coords: { latitude: 26.9124, longitude: 75.7873, accuracy: 5 }, timestamp: Date.now() };
  await act(async () => {
    geoState.successCb?.(fix);
    await sleep(25);
  });
  const rpcCalls = backendCalls.filter((c) => c.kind === 'rpc' && c.fn === 'save_my_private_location');
  assert(rpcCalls.length === 1, 'accepted fix saved through canonical RPC save_my_private_location');
  assert(
    Boolean(rpcCalls[0]) &&
      (rpcCalls[0].params as Record<string, unknown>).p_latitude === 26.9124 &&
      (rpcCalls[0].params as Record<string, unknown>).p_longitude === 75.7873 &&
      (rpcCalls[0].params as Record<string, unknown>).p_accuracy_m === 5,
    'RPC payload carries p_latitude/p_longitude/p_accuracy_m',
  );
  assert(
    !('user_id' in (rpcCalls[0]?.params ?? {})) && !('p_user_id' in (rpcCalls[0]?.params ?? {})),
    'RPC payload contains NO target user id (identity from auth.uid() server-side)',
  );
  assert(
    typeof (rpcCalls[0]?.params as Record<string, unknown>).p_captured_at === 'string' &&
      !Number.isNaN(Date.parse(String((rpcCalls[0]?.params as Record<string, unknown>).p_captured_at))),
    'RPC payload carries a valid p_captured_at ISO timestamp',
  );
  await unmount();
}

// 4. Canonical RPC absent (PGRST202) → RLS-gated table upsert fallback
{
  reset();
  const client = makeFakeClient({ session, rpcError: { code: 'PGRST202', message: 'Could not find the function' } });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }));
  const fix = { coords: { latitude: 26.9124, longitude: 75.7873, accuracy: 8 }, timestamp: Date.now() };
  await act(async () => {
    geoState.successCb?.(fix);
    await sleep(25);
  });
  const upserts = backendCalls.filter((c) => c.kind === 'upsert' && c.table === 'user_private_locations');
  assert(upserts.length === 1, 'fallback: upsert into user_private_locations after PGRST202');
  assert(
    Boolean(upserts[0]) && upserts[0].payload?.user_id === 'user-1',
    'fallback payload carries the VERIFIED user id (getUser) — RLS still enforced server-side',
  );
  await unmount();
}

// 5. Saved row restored from backend on session start, never re-written
{
  reset();
  const savedReads = { count: 0 };
  const client = makeFakeClient({
    session,
    savedReads,
    savedRow: {
      latitude: 26.9,
      longitude: 75.8,
      accuracy_m: 12,
      captured_at: new Date(Date.now() - 60_000).toISOString(),
    },
  });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }));
  assert(savedReads.count >= 1, 'session start: own location row loaded from backend (loadOwnLocation)');
  const stored = dom.window.localStorage.getItem('nexora_last_accurate_fix');
  assert(Boolean(stored), 'restored row persisted into the device fix cache');
  const rpcWrites = backendCalls.filter((c) => c.kind === 'rpc' && c.fn === 'save_my_private_location');
  assert(rpcWrites.length === 0, 'restored row is NOT written back to the backend (no loop)');
  await unmount();
}

// 6. StrictMode double-mount — still exactly one watcher (no duplicates)
{
  reset();
  const client = makeFakeClient({ session });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }), true);
  assert(geoState.watchCalls === 1, 'StrictMode remount: watcher deduped to ONE (module registry)');
  await unmount();
}

// 7. SIGNED_OUT — watcher stopped immediately, subscription unsubscribed
{
  reset();
  const client = makeFakeClient({ session });
  const { unmount } = await render(React.createElement(Probe, { enabled: true, client }));
  assert(geoState.watchCalls === 1, 'precondition: one watcher for the logout test');
  await act(async () => {
    (client as { auth: { _emit: (e: string, s: null) => void } }).auth._emit('SIGNED_OUT', null);
    await sleep(10);
  });
  assert(geoState.activeWatches.size === 0 && geoState.clearCalls >= 1, 'SIGNED_OUT: watcher cleared (cleanup on logout)');
  const beforeUnmountUnsubs = unsubscribed;
  await unmount();
  assert(unsubscribed > beforeUnmountUnsubs, 'unmount: auth subscription unsubscribed');
}

// 8. Unmount while active — watcher stopped
{
  reset();
  const client = makeFakeClient({ session });
  const rendered = await render(React.createElement(Probe, { enabled: true, client }));
  assert(geoState.activeWatches.size === 1, 'precondition: watcher active before unmount');
  await rendered.unmount();
  assert(geoState.activeWatches.size === 0, 'unmount: watcher cleared (no orphan GPS watch)');
}

// 9. Re-enable after SIGNED_OUT — watcher restarts exactly once
{
  reset();
  const client = makeFakeClient({ session });
  const rendered = await render(React.createElement(Probe, { enabled: true, client }));
  await act(async () => {
    (client as { auth: { _emit: (e: string, s: null) => void } }).auth._emit('SIGNED_OUT', null);
    await sleep(10);
  });
  assert(geoState.activeWatches.size === 0, 'after SIGNED_OUT: idle');
  await rendered.rerender(React.createElement(Probe, { enabled: false, client }));
  await rendered.rerender(React.createElement(Probe, { enabled: true, client }));
  assert(geoState.activeWatches.size === 1, 're-enable: single watcher resumed');
  assert(geoState.watchCalls === 2, 're-enable: exactly one new watcher started (no stack-up)');
  await rendered.unmount();
}

console.log('\n' + '='.repeat(64));
if (failures === 0) {
  console.log('\u001b[32mRESULT: location sync lifecycle verified — authenticated-only, canonical RPC, single watcher, cleanup on logout/unmount.\u001b[0m\n');
  process.exit(0);
}
console.log(`\u001b[31mRESULT: ${failures} assertion(s) failed.\u001b[0m\n`);
process.exit(1);
