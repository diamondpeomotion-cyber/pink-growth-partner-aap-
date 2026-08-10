// Shop (salon) context for the Growth Partner app.
//
// SECURITY CONTRACT
// -----------------
// 1. The set of shops a partner may act on is resolved ONLY from the database
//    (shop_attributions for the signed-in partner, read under RLS with the
//    anon key + user session). Never from localStorage, never from the URL.
// 2. The "currently selected shop" is cached per (user, ) in sessionStorage so
//    the selection survives in-app navigation, but the cached id is ALWAYS
//    re-validated against the freshly fetched allow-list before use.
// 3. URL parameters are actively ignored AND stripped: `?shop=`, `?shopId=`,
//    `?salon=`, `?salon_id=`, `?attribution=` etc. cannot switch the context.
//    (The app is a state-driven SPA with no router, so nothing reads them —
//    this guard makes that guarantee explicit and permanent.)
// 4. No service-role key is used anywhere; every read/write goes through the
//    normal authenticated anon client and stays subject to existing RLS.

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveGrowthPartner, fetchMyAttributions } from './gpRepository';

/** A shop the signed-in partner is actually attributed to. */
export interface PartnerShop {
  /** shop_attributions.id */
  attributionId: string;
  /** salons.id — the canonical shop/salon identifier used for the website. */
  salonId: string;
  name: string;
  city: string;
  area: string;
  status: string;
  attributionMethod: string | null;
}

export interface ShopContextSnapshot {
  partnerId: string | null;
  userId: string | null;
  shops: PartnerShop[];
  /** null when the partner has no attributed shops (or none selected yet). */
  selected: PartnerShop | null;
}

/** Query keys that must never be able to change the active shop. */
const FORBIDDEN_SHOP_PARAMS = [
  'shop',
  'shopid',
  'shop_id',
  'salon',
  'salonid',
  'salon_id',
  'store',
  'storeid',
  'store_id',
  'attribution',
  'attribution_id',
  'attributionid',
  'business',
  'business_id',
];

/**
 * Remove any shop-selecting parameter from the address bar (query string and
 * hash) without navigating. Called on every mount of the website surface, so a
 * hand-crafted link like `/?shopId=<other-shop>` neither selects nor leaks a
 * shop. Returns true when something was stripped (useful for telemetry/tests).
 */
export function stripShopParamsFromUrl(): boolean {
  if (typeof window === 'undefined' || !window.history?.replaceState) return false;
  let mutated = false;

  const url = new URL(window.location.href);
  for (const key of Array.from(url.searchParams.keys())) {
    if (FORBIDDEN_SHOP_PARAMS.includes(key.toLowerCase())) {
      url.searchParams.delete(key);
      mutated = true;
    }
  }

  if (url.hash.startsWith('#') && url.hash.includes('=')) {
    const hashParams = new URLSearchParams(url.hash.slice(1));
    let hashMutated = false;
    for (const key of Array.from(hashParams.keys())) {
      if (FORBIDDEN_SHOP_PARAMS.includes(key.toLowerCase())) {
        hashParams.delete(key);
        hashMutated = true;
      }
    }
    if (hashMutated) {
      const rest = hashParams.toString();
      url.hash = rest ? `#${rest}` : '';
      mutated = true;
    }
  }

  if (mutated) {
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return mutated;
}

const selectionKey = (userId: string) => `nexora_gp_selected_salon:${userId}`;

/** Read the cached selection. NOT trusted — must be validated by the caller. */
function readCachedSelection(userId: string): string | null {
  try {
    return window.sessionStorage.getItem(selectionKey(userId));
  } catch {
    return null;
  }
}

export function rememberSelectedShop(userId: string, salonId: string): void {
  try {
    window.sessionStorage.setItem(selectionKey(userId), salonId);
  } catch {
    /* private mode / storage disabled — selection simply won't persist */
  }
}

export function forgetSelectedShop(userId: string): void {
  try {
    window.sessionStorage.removeItem(selectionKey(userId));
  } catch {
    /* ignore */
  }
}

/**
 * Load the shops this partner is attributed to and resolve the active one.
 *
 * `preferSalonId` is an in-app request (e.g. the user tapped a shop card). It
 * is honoured ONLY if that salon is in the server-provided allow-list.
 */
export async function loadShopContext(
  client: SupabaseClient,
  preferSalonId?: string | null,
): Promise<ShopContextSnapshot> {
  // A shop parameter in the URL must never influence the context.
  stripShopParamsFromUrl();

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return { partnerId: null, userId: null, shops: [], selected: null };
  }

  const partner = await resolveGrowthPartner(client, user.id);
  if (!partner) {
    return { partnerId: null, userId: user.id, shops: [], selected: null };
  }

  const attributions = await fetchMyAttributions(client, String(partner.id));
  const shops: PartnerShop[] = attributions
    .filter((a) => Boolean(a.salon_id))
    .map((a) => ({
      attributionId: String(a.id),
      salonId: String(a.salon_id),
      name: a.salon_name ?? 'Shop',
      city: a.salon_city ?? '',
      area: a.salon_area ?? '',
      status: String(a.status ?? 'unknown'),
      attributionMethod: a.attribution_method ?? null,
    }));

  // Allow-list check happens here, on server-provided data only.
  const allowed = new Set(shops.map((s) => s.salonId));
  const cached = readCachedSelection(user.id);

  let selectedId: string | null = null;
  if (preferSalonId && allowed.has(preferSalonId)) selectedId = preferSalonId;
  else if (cached && allowed.has(cached)) selectedId = cached;
  else if (shops.length === 1) selectedId = shops[0].salonId;

  if (!selectedId && cached) forgetSelectedShop(user.id);
  if (selectedId) rememberSelectedShop(user.id, selectedId);

  return {
    partnerId: String(partner.id),
    userId: user.id,
    shops,
    selected: shops.find((s) => s.salonId === selectedId) ?? null,
  };
}

/**
 * Defence-in-depth re-check used right before any write. RLS on the server is
 * the real gate; this stops an obviously wrong id from ever being sent.
 */
export async function assertShopBelongsToPartner(
  client: SupabaseClient,
  partnerId: string,
  salonId: string,
): Promise<void> {
  const { data, error } = await client
    .from('shop_attributions')
    .select('id')
    .eq('growth_partner_id', partnerId)
    .eq('salon_id', salonId)
    .limit(1);
  if (error) {
    // Cannot verify (offline / missing relation): let the server decide. RLS
    // still rejects an unauthorized write.
    return;
  }
  if (!data || data.length === 0) {
    throw new Error('This shop is not attributed to your Growth Partner account.');
  }
}
