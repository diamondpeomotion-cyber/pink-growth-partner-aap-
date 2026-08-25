// Nexora universal Supabase client — the SINGLE auth client for this app.
//
// Canonical module: src/lib/supabase.ts.  The legacy path
// src/lib/supabaseClient.ts is now a thin re-export of this module so every
// existing import resolves to the SAME client instance (a second instance
// would be a second auth system and would double onAuthStateChange listeners).
//
// Locked Nexora auth configuration (do not downgrade):
//   storageKey         'nexora.auth.qwaehqsmodekbgvnaavz'  (shared across apps)
//   persistSession     true        — session survives reloads
//   autoRefreshToken   true        — expired tokens refresh silently
//   detectSessionInUrl true        — PKCE/OAuth callbacks consumed from URL
//   flowType           'pkce'      — code exchange + verifier, never implicit
//
// Password recovery with PKCE
// ---------------------------
// Recovery emails land tokens in the URL hash (#access_token=…&type=recovery).
// gotrue-js classifies that shape as an *implicit* callback, which a PKCE
// client rejects ("Not a valid PKCE flow url"). To keep BOTH the PKCE mandate
// and the existing reset flow, this module captures the recovery tokens
// synchronously at load, strips the hash BEFORE createClient() boots so the
// PKCE client never sees an implicit-style URL, and the App re-validates the
// tokens through auth.setSession() on the SAME client (server-side validation
// included). This is not a second auth system: same client, same storage key,
// official supabase-js API, still subject to RLS.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz';
const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;

/**
 * The shared Nexora auth storage key. Supabase's VITE_SUPABASE_STORAGE_KEY
 * convention is honoured by definition: the key is pinned to this constant so
 * every Nexora app shares one session store. It must not be overridden.
 */
export const NEXORA_AUTH_STORAGE_KEY = 'nexora.auth.qwaehqsmodekbgvnaavz';

/**
 * Exact, locked auth options for the Nexora shared client. Exported so the
 * verification suite can assert the contract programmatically.
 */
export const NEXORA_AUTH_OPTIONS = {
  storageKey: NEXORA_AUTH_STORAGE_KEY,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
} as const;

/** Legacy default storage keys this app may have used before the Nexora key. */
const LEGACY_AUTH_STORAGE_KEYS = [`sb-${SUPABASE_PROJECT_REF}-auth-token`];

type SupabaseConfigResult =
  | { isValid: true; url: string; anonKey: string; error: null }
  | { isValid: false; url: null; anonKey: null; error: string };

const isBrowserSafeSupabaseKey = (key: string): boolean => {
  if (key.startsWith('sb_publishable_')) {
    return key.length > 'sb_publishable_'.length;
  }
  const jwtParts = key.split('.');
  if (jwtParts.length !== 3) return false;
  try {
    const base64UrlPayload = jwtParts[1];
    const base64Payload = base64UrlPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64UrlPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64Payload)) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
};

export const validateSupabaseConfig = (
  rawUrl: unknown,
  rawAnonKey: unknown,
): SupabaseConfigResult => {
  const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const anonKey = typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '';

  if (!url || !anonKey) {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error:
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the hosting environment.',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error: 'Supabase configuration is invalid. Check the deployment environment variables.',
    };
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== EXPECTED_SUPABASE_HOSTNAME ||
    parsedUrl.username ||
    parsedUrl.password ||
    (parsedUrl.pathname !== '/' && parsedUrl.pathname !== '') ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error: `Supabase configuration must use the approved ${SUPABASE_PROJECT_REF} project.`,
    };
  }

  if (!isBrowserSafeSupabaseKey(anonKey)) {
    return {
      isValid: false,
      url: null,
      anonKey: null,
      error: 'Supabase configuration contains an invalid browser key.',
    };
  }

  return { isValid: true, url: parsedUrl.origin, anonKey, error: null };
};

const viteEnv = (import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
}).env;

const config = validateSupabaseConfig(
  viteEnv?.VITE_SUPABASE_URL,
  viteEnv?.VITE_SUPABASE_ANON_KEY,
);

/**
 * Password-recovery link detection — captured SYNCHRONOUSLY at module load,
 * BEFORE createClient() starts its async hash consumption. Reading the URL
 * later (e.g. inside a React effect) races with supabase-js, which may have
 * already stripped the hash → the app would miss expired-link errors.
 */
export const initialRecoveryLink: { intent: boolean; error: string | null } = (() => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#')) {
    return { intent: false, error: null };
  }
  const hp = new URLSearchParams(window.location.hash.slice(1));
  const err = hp.get('error_description') ?? hp.get('error');
  if (err) {
    return {
      intent: true,
      error: 'This reset link is invalid, expired or was already used. Request a fresh one below.',
    };
  }
  if (hp.get('type') === 'recovery') return { intent: true, error: null };
  return { intent: false, error: null };
})();

/**
 * Raw recovery tokens captured from the URL at module load (see above).
 * Consumed exactly once by the App via auth.setSession(), then discarded.
 * Never logged; the URL hash is stripped immediately after capture.
 */
export const initialRecoveryTokens: { access_token: string; refresh_token: string } | null = (() => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#')) return null;
  const hp = new URLSearchParams(window.location.hash.slice(1));
  if (hp.get('type') !== 'recovery') return null;
  const access_token = hp.get('access_token');
  const refresh_token = hp.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
})();

/**
 * Strip a recovery/error hash BEFORE the PKCE client boots. Under flowType
 * 'pkce', gotrue-js would classify #access_token=…&type=recovery as an
 * implicit callback and throw "Not a valid PKCE flow url." — the tokens are
 * already captured above, so removing the hash now keeps the client on the
 * clean storage-recovery path while the App completes the reset via
 * auth.setSession(). PKCE OAuth callbacks (#code=…) are NEVER stripped.
 */
(() => {
  if (typeof window === 'undefined') return;
  if (!initialRecoveryLink.intent) return;
  try {
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
  } catch {
    /* history unavailable — gotrue will simply ignore the PKCE-mismatched URL */
  }
})();

/**
 * One-time migration of a session persisted under the legacy default key
 * (sb-qwaehqsmodekbgvnaavz-auth-token) into the Nexora shared key, so users
 * who signed in before the Nexora architecture stay signed in. Runs before
 * createClient() and only when the new key is empty; the legacy key is
 * removed immediately so it can never resurrect a signed-out session.
 * Exported for the offline verification suite (scripts/verify-nexora-auth.ts).
 */
export const migrateLegacySessionStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (window.localStorage.getItem(NEXORA_AUTH_STORAGE_KEY)) return;
    for (const legacyKey of LEGACY_AUTH_STORAGE_KEYS) {
      const raw = window.localStorage.getItem(legacyKey);
      if (!raw) continue;
      let session: unknown = null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const candidate = parsed as { access_token?: unknown; refresh_token?: unknown; currentSession?: unknown };
          if (candidate.access_token && candidate.refresh_token) {
            session = parsed;
          } else if (
            candidate.currentSession &&
            typeof candidate.currentSession === 'object'
          ) {
            const inner = candidate.currentSession as { access_token?: unknown; refresh_token?: unknown };
            if (inner.access_token && inner.refresh_token) session = candidate.currentSession;
          }
        }
      } catch {
        session = null;
      }
      if (session) {
        window.localStorage.setItem(NEXORA_AUTH_STORAGE_KEY, JSON.stringify(session));
        window.localStorage.removeItem(legacyKey);
        console.info('[NexoraAuth] migrated legacy session into the shared Nexora storage key');
        return;
      }
      // Unrecognisable legacy blob — never let it linger.
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    /* storage blocked — never fatal */
  }
};

/**
 * Remove every auth-storage key this app has ever used (Nexora + legacy).
 * Called on sign-out so a stale token can never survive in any slot.
 */
export const clearAllAuthStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(NEXORA_AUTH_STORAGE_KEY);
    for (const legacyKey of LEGACY_AUTH_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
  } catch {
    /* ignore */
  }
};

export const supabaseConfigError = config.isValid ? null : config.error;

/**
 * Build a Nexora-configured client. Used by the app singleton below and by
 * the live verification scripts so tests exercise the EXACT same auth
 * options as production. Mirrors the canonical Nexora client factory
 * (packages/auth/src/client.ts in the main-website repo), including the
 * x-nexora-client marker header.
 */
export const buildNexoraClient = (url: string, anonKey: string): SupabaseClient =>
  createClient(url, anonKey, {
    auth: {
      storageKey: NEXORA_AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-nexora-client': 'nexora-auth/1',
      },
    },
  });

export const supabase: SupabaseClient | null = (() => {
  if (!config.isValid) return null;
  migrateLegacySessionStorage();
  return buildNexoraClient(config.url, config.anonKey);
})();
