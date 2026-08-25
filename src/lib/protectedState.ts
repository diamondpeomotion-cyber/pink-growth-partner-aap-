// Protected client-state clearing (Nexora auth architecture).
//
// When a session dies (SIGNED_OUT, failed refresh, role denial, expired token,
// logout) every protected cache must be wiped so stale per-user data can never
// leak into the next session. Login convenience fields (e.g. remembered
// username) are deliberately NOT protected and survive.
//
// Key inventory (kept in one place so the sweep can never drift):
//   nexora_dashboard_cache        dashboard summary cache
//   nexora_last_sync_timestamp    last sync marker
//   nexora_partner_profile        partner profile cache
//   nexora_last_accurate_fix      device GPS fix cache (identity data)
//   add_shop_form_draft           shop application draft (owner PII)
//   store_is_published            publish-state cache
//   simulatedQualifyingCount      legacy qualify-count cache
//   sessionStorage:
//   nexora_gp_selected_salon:<uid>  selected-shop cache (also per-user, swept)
//
// auth-related storage (nexora.auth.qwaehqsmodekbgvnaavz + legacy keys) is
// cleared by clearAllAuthStorage() in lib/supabase.ts.

import { forgetSelectedShop } from './shopContext';

export const NEXORA_PROTECTED_LOCAL_KEYS = [
  'nexora_dashboard_cache',
  'nexora_last_sync_timestamp',
  'nexora_partner_profile',
  'nexora_last_accurate_fix',
  'add_shop_form_draft',
  'store_is_published',
  'simulatedQualifyingCount',
] as const;

const SELECTED_SHOP_PREFIX = 'nexora_gp_selected_salon:';

/** Storage interface compatible with window.localStorage/sessionStorage (and
 *  the jsdom-backed test storages). */
export interface ClearableStorage {
  removeItem: (key: string) => void;
  setItem?: (key: string, value: string) => void;
  getItem?: (key: string) => string | null;
  key?: (index: number) => string | null;
  readonly length?: number;
}

const readAllKeys = (storage: ClearableStorage | undefined | null): string[] => {
  if (!storage || typeof storage.key !== 'function' || typeof storage.length !== 'number') {
    return [];
  }
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const k = storage.key(i);
    if (k) keys.push(k);
  }
  return keys;
};

/**
 * Wipe every protected cache for the signed-out user. Safe to call with no
 * session, after partial sign-outs, and under storage restrictions (private
 * mode) — never throws.
 */
export const clearProtectedState = (userId: string | null = null): void => {
  try {
    if (userId) forgetSelectedShop(userId);
    // Sweep ANY per-user selected-shop entries (e.g. older user ids whose
    // mapping we no longer know) — sessionStorage, never login convenience.
    for (const key of readAllKeys(window.sessionStorage)) {
      if (key.startsWith(SELECTED_SHOP_PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  try {
    for (const key of NEXORA_PROTECTED_LOCAL_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
};
