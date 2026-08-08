// Supabase client for the Growth Partner PWA.
// NEW (Phase 1): this app previously had zero Supabase integration and a fake
// localStorage auth. It now connects to the shared Nexora project
// qwaehqsmodekbgvnaavz and refuses any other project (hostname validated).
//
// Configure via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_REF = 'qwaehqsmodekbgvnaavz';
const EXPECTED_SUPABASE_HOSTNAME = `${SUPABASE_PROJECT_REF}.supabase.co`;

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

export const supabaseConfigError = config.isValid ? null : config.error;
// flowType 'implicit' is REQUIRED for email recovery links: the emailed
// verify-URL lands tokens in the URL hash (#access_token=...&type=recovery),
// which a PKCE-mode client rejects ("Not a valid PKCE flow url") because the
// code verifier only exists in the browser that requested the reset — and
// users routinely open recovery emails in a DIFFERENT browser/app webview.
// Password sign-in (grant) is unaffected by this setting.
export const supabase = config.isValid
  ? createClient(config.url, config.anonKey, { auth: { flowType: 'implicit' } })
  : null;
