// Growth Partner data layer — NEW (Phase 1).
// Reads the shared Supabase project (qwaehqsmodekbgvnaavz):
//   - growth_partners            partner identity (locked rule #3 actor)
//   - shop_attributions          which shops are attributed to this partner
//   - growth_partner_commissions 10% of platform fee per booking, 7-day hold
//                                (locked rules #3 + #4 — enforced server-side)
//   - salon_setup_proposals      website setups this partner prepared
// All money movement (hold release, payouts) happens server-side; this layer
// is read-only for ledgers. No service_role anywhere.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface GrowthPartnerRow {
  id: string;
  user_id: string | null;
  [key: string]: unknown;
}

export interface GpAttribution {
  id: string;
  salon_id: string;
  status: string;
  attribution_method: string | null;
  effective_from: string | null;
  salon_name?: string;
  salon_city?: string;
  salon_area?: string;
  /** Geo coordinates for client-side Haversine distance (nearest-first sort). */
  salon_latitude?: number | null;
  salon_longitude?: number | null;
}

export interface CommissionSummary {
  heldPaise: number;
  payablePaise: number;
  paidPaise: number;
  heldCount: number;
  payableCount: number;
  paidCount: number;
  nextReleaseDate: string | null;
}

export interface GpProposal {
  id: string;
  salon_id: string | null;
  status: string;
  updated_at: string | null;
}

const isMissingRelationError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /could not find a (table|schema)|relation .* does not exist/i.test(error.message || '')
  );
};

/**
 * Resolve the growth_partners row for the signed-in auth user.
 * Returns null when the account has no partner record yet (role not assigned).
 */
export async function resolveGrowthPartner(
  client: SupabaseClient,
  userId: string,
): Promise<GrowthPartnerRow | null> {
  const { data, error } = await client
    .from('growth_partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  return (data as GrowthPartnerRow | null) ?? null;
}

/**
 * Role guard: only permanent growth partners may use this app. Checks
 * user_roles first, then profiles.platform_role (district_partner is the
 * legacy label for the same role). The role always comes from the database —
 * never from localStorage, URL params or frontend state.
 */
export async function isGrowthPartnerRole(
  client: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; foundRole: string | null }> {
  const GP_ROLES = new Set(['growth_partner', 'district_partner']);
  try {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (!error && Array.isArray(data) && data.length > 0) {
      const roles = data.map((r: any) => String(r.role));
      const match = roles.find((r) => GP_ROLES.has(r));
      if (match) return { allowed: true, foundRole: match };
      return { allowed: false, foundRole: roles[0] ?? null };
    }
    // Query succeeded but user has no roles at all → definitively a
    // non-partner account (e.g. plain customer), do not fall through.
    if (!error) return { allowed: false, foundRole: null };
  } catch {
    // fall through to profiles check
  }
  try {
    const { data, error } = await client
      .from('profiles')
      .select('platform_role')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data?.platform_role) {
      const role = String(data.platform_role);
      return { allowed: GP_ROLES.has(role), foundRole: role };
    }
  } catch {
    // no role source available
  }
  return { allowed: false, foundRole: null };
}

export type PartnerAccessState = 'authorized' | 'denied' | 'unknown';

/**
 * Tri-state access check for session restore. 'denied' is returned only when
 * the database DEFINITIVELY answered (role exists and is not a partner role,
 * or the account has a profile whose role is not a partner role). Network or
 * transient failures return 'unknown' so the offline-first shell can keep the
 * signed-in session alive — RLS still enforces access server-side.
 */
export async function checkGrowthPartnerAccess(
  client: SupabaseClient,
  userId: string,
): Promise<{ state: PartnerAccessState; foundRole: string | null }> {
  const GP_ROLES = new Set(['growth_partner', 'district_partner']);
  let profileLookedUp = false;
  try {
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (!error && Array.isArray(data) && data.length > 0) {
      const roles = data.map((r: any) => String(r.role));
      const match = roles.find((r) => GP_ROLES.has(r));
      if (match) return { state: 'authorized', foundRole: match };
      return { state: 'denied', foundRole: roles[0] ?? null };
    }
    if (error) {
      // Could not read the view (offline / transient) — cannot decide.
      return { state: 'unknown', foundRole: null };
    }
    // View answered with zero rows. The view maps one row per profile, so a
    // definitive "no roles" only holds once we know whether a profile exists.
    profileLookedUp = true;
  } catch {
    return { state: 'unknown', foundRole: null };
  }
  if (profileLookedUp) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('platform_role')
        .eq('id', userId)
        .maybeSingle();
      if (error) return { state: 'unknown', foundRole: null };
      if (data?.platform_role) {
        const role = String(data.platform_role);
        return GP_ROLES.has(role)
          ? { state: 'authorized', foundRole: role }
          : { state: 'denied', foundRole: role };
      }
      // Profile exists but role column empty → treat as denied (unprovisioned
      // accounts must not get application access).
      return { state: 'denied', foundRole: null };
    } catch {
      return { state: 'unknown', foundRole: null };
    }
  }
  return { state: 'unknown', foundRole: null };
}

/** Shops attributed to this partner (active attributions + salon basics). */
export async function fetchMyAttributions(
  client: SupabaseClient,
  partnerId: string,
): Promise<GpAttribution[]> {
  const { data, error } = await client
    .from('shop_attributions')
    .select('id, salon_id, status, attribution_method, effective_from')
    .eq('growth_partner_id', partnerId)
    .order('effective_from', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  const rows = (data ?? []) as GpAttribution[];

  const salonIds = Array.from(new Set(rows.map((r) => r.salon_id).filter(Boolean)));
  if (salonIds.length > 0) {
    try {
      const { data: salons } = await client
        .from('salons')
        .select('id, name, city, area, latitude, longitude')
        .in('id', salonIds);
      const byId = new Map((salons ?? []).map((s: any) => [s.id, s]));
      for (const row of rows) {
        const salon = byId.get(row.salon_id);
        if (salon) {
          row.salon_name = salon.name;
          row.salon_city = salon.city;
          row.salon_area = salon.area;
          row.salon_latitude = typeof salon.latitude === 'number' ? salon.latitude : null;
          row.salon_longitude = typeof salon.longitude === 'number' ? salon.longitude : null;
        }
      }
    } catch {
      // salon labels are decorative — never block the ledger on them
    }
  }
  return rows;
}

/**
 * Commission ledger summary (locked rules #3/#4):
 *  - held:    earning inside its 7-day hold window
 *  - payable: hold elapsed, awaiting the payout run
 *  - paid:    settled
 */
export async function fetchCommissionSummary(
  client: SupabaseClient,
  partnerId: string,
): Promise<CommissionSummary> {
  const { data, error } = await client
    .from('growth_partner_commissions')
    .select('commission_paise, status, hold_until')
    .eq('growth_partner_id', partnerId)
    .order('hold_until', { ascending: true });
  if (error) {
    if (isMissingRelationError(error)) {
      return {
        heldPaise: 0,
        payablePaise: 0,
        paidPaise: 0,
        heldCount: 0,
        payableCount: 0,
        paidCount: 0,
        nextReleaseDate: null,
      };
    }
    throw error;
  }

  const summary: CommissionSummary = {
    heldPaise: 0,
    payablePaise: 0,
    paidPaise: 0,
    heldCount: 0,
    payableCount: 0,
    paidCount: 0,
    nextReleaseDate: null,
  };
  for (const row of data ?? []) {
    const amount = Number(row.commission_paise ?? 0);
    if (row.status === 'held') {
      summary.heldPaise += amount;
      summary.heldCount += 1;
      if (!summary.nextReleaseDate && row.hold_until) summary.nextReleaseDate = String(row.hold_until);
    } else if (row.status === 'payable') {
      summary.payablePaise += amount;
      summary.payableCount += 1;
    } else if (row.status === 'paid') {
      summary.paidPaise += amount;
      summary.paidCount += 1;
    }
    // void / clawed_back are excluded — they never belong to the partner
  }
  return summary;
}

/** Website setup proposals prepared by this partner (status tracking only —
 *  the Shop Owner app performs the review via review_salon_setup). */
export async function fetchMyProposals(
  client: SupabaseClient,
  partnerId: string,
): Promise<GpProposal[]> {
  const { data, error } = await client
    .from('salon_setup_proposals')
    .select('id, salon_id, status, updated_at')
    .eq('growth_partner_id', partnerId)
    .order('updated_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return (data ?? []) as GpProposal[];
}

// ---------------------------------------------------------------------------
// Phase 4 additions — live ledger entries, payouts, notifications, profile,
// shop-application submission (contract verified against the live project;
// server-side RLS may reject the insert — surfaced to the UI, never faked).
// ---------------------------------------------------------------------------

export interface CommissionEntry {
  id: string;
  salonId: string | null;
  bookingId: string | null;
  commissionPaise: number;
  status: string;
  holdUntil: string | null;
  createdAt: string | null;
}

export async function fetchCommissionEntries(
  client: SupabaseClient,
  partnerId: string,
): Promise<CommissionEntry[]> {
  const { data, error } = await client
    .from('growth_partner_commissions')
    .select('id, salon_id, booking_id, commission_paise, status, hold_until, created_at')
    .eq('growth_partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    salonId: r.salon_id ? String(r.salon_id) : null,
    bookingId: r.booking_id ? String(r.booking_id) : null,
    commissionPaise: Number(r.commission_paise ?? 0),
    status: String(r.status ?? 'unknown'),
    holdUntil: r.hold_until ? String(r.hold_until) : null,
    createdAt: r.created_at ? String(r.created_at) : null,
  }));
}

export interface PartnerPayout {
  id: string;
  status: string;
  amountPaise: number;
  createdAt: string | null;
  paidAt: string | null;
}

export async function fetchMyPayouts(
  client: SupabaseClient,
  partnerId: string,
): Promise<PartnerPayout[]> {
  // select=* is intentionally defensive: the live partner_payouts columns are
  // not documented in any migration; amount fields differ per environment.
  const { data, error } = await client
    .from('partner_payouts')
    .select('*')
    .eq('growth_partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    status: String(r.status ?? 'unknown'),
    amountPaise: Number(r.amount_paise ?? r.total_paise ?? r.amount ?? 0),
    createdAt: r.created_at ? String(r.created_at) : null,
    paidAt: r.paid_at ?? r.settled_at ?? null,
  }));
}

export interface PartnerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | null;
}

export async function fetchPartnerNotifications(
  client: SupabaseClient,
  userId: string,
): Promise<PartnerNotification[]> {
  const { data, error } = await client
    .from('notifications')
    .select('id, notification_type, title, message, read_at, created_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    type: String(r.notification_type ?? 'general'),
    title: String(r.title ?? 'Nexora'),
    message: String(r.message ?? ''),
    read: Boolean(r.read_at),
    createdAt: r.created_at ? String(r.created_at) : null,
  }));
}

/** Update the partner's own profile row (RLS: profiles_update_own). */
export async function updatePartnerProfile(
  client: SupabaseClient,
  patch: { full_name?: string; phone?: string | null; avatar_path?: string | null },
): Promise<void> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated.');
  const { error } = await client.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

export interface ShopApplicationInput {
  ownerEmail: string;
  ownerPhone: string;
  shopName: string;
  city: string;
  locality: string;
  fullAddress: string;
  openingTime: string;
  closingTime: string;
  aboutShop: string;
  websiteTemplate: string;
}

/**
 * Submit a new shop application + website-setup proposal. Contract mirrors the
 * proven dashboard flow (save_growth_partner_salon_setup RPC). The live
 * server currently REJECTS the application insert via RLS (42501) — the error
 * is surfaced to the UI so nothing is silently faked.
 */
export async function submitShopApplication(
  client: SupabaseClient,
  input: ShopApplicationInput,
): Promise<{ applicationId: string }> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  // 1. Resolve (or create) the partner identity row.
  let partner = await resolveGrowthPartner(client, user.id);
  if (!partner) {
    const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { data: newPartner, error: partnerErr } = await client
      .from('growth_partners')
      .insert({
        user_id: user.id,
        partner_code: `NXR${suffix}`,
        referral_code: `REF${suffix}`,
        status: 'applied',
      })
      .select('id')
      .single();
    if (partnerErr) throw partnerErr;
    partner = { id: newPartner.id, user_id: user.id };
  }

  // 2. Create the onboarding application (server RLS decides).
  const { data: app, error: appErr } = await client
    .from('shop_onboarding_applications')
    .insert({
      submitted_by_partner_id: partner.id,
      status: 'draft',
      current_step: 6,
      owner_email: input.ownerEmail.trim().toLowerCase(),
      owner_phone: input.ownerPhone.trim(),
      shop_name: input.shopName.trim(),
      city: input.city.trim(),
      locality: input.locality.trim(),
      full_address: input.fullAddress.trim(),
      opening_time: input.openingTime,
      closing_time: input.closingTime,
      about_shop: input.aboutShop.trim(),
      website_template: input.websiteTemplate,
    })
    .select('id')
    .single();
  if (appErr) throw appErr;

  // 3. Save the website-setup proposal payload.
  const payload = {
    profile: {
      name: input.shopName.trim(),
      description: input.aboutShop.trim(),
      phone: input.ownerPhone.trim(),
      email: input.ownerEmail.trim().toLowerCase(),
      address: input.fullAddress.trim(),
      area: input.locality.trim(),
      city: input.city.trim(),
      opening_hours: { opens: input.openingTime, closes: input.closingTime },
    },
    services: [],
    template: { key: input.websiteTemplate },
  };
  const { error: proposalErr } = await client.rpc('save_growth_partner_salon_setup', {
    p_application_id: app.id,
    p_payload: payload,
    p_submit: true,
  });
  if (proposalErr) throw proposalErr;

  return { applicationId: String(app.id) };
}
