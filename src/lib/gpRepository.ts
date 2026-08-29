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
  /** Live count of qualifying customer QR scans (rewards/qualification). */
  active_scans?: number;
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
  /** Commissions created in the last 7 days (held + payable + paid). */
  weekPaise: number;
  /** held + payable + paid (void/clawed_back excluded). */
  lifetimePaise: number;
}

export const emptyCommissionSummary = (): CommissionSummary => ({
  heldPaise: 0,
  payablePaise: 0,
  paidPaise: 0,
  heldCount: 0,
  payableCount: 0,
  paidCount: 0,
  nextReleaseDate: null,
  weekPaise: 0,
  lifetimePaise: 0,
});

/** Convert paise to whole rupees for display (never invents a value). */
export const paiseToRupees = (paise: number): number => Math.round(Number(paise || 0) / 100);

export const formatINR = (rupees: number): string =>
  `₹${Number(rupees || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

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

/** Postgres unique-violation code — used to collapse concurrent inserts. */
const isUniqueViolation = (error: { code?: string; message?: string } | null): boolean =>
  Boolean(error) && (error?.code === '23505' || /duplicate key value violates unique constraint/i.test(error?.message ?? ''));

/** Statuses that count as an "open" application eligible for de-duplication. */
const OPEN_APPLICATION_STATUSES = ['draft', 'submitted', 'changes_requested'];

/**
 * Find an existing open application for this partner, preferring an exact
 * salon link and falling back to an exact shop-name match (so a brand-new shop
 * submitted through AddShop — which has no `existing_salon_id` yet — is reused
 * instead of creating a second row). Returns the application id or null.
 */
async function findExistingApplication(
  client: SupabaseClient,
  partnerId: string,
  existingSalonId: string | null | undefined,
  shopName: string | null | undefined,
): Promise<string | null> {
  if (existingSalonId) {
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .select('id')
      .eq('submitted_by_partner_id', partnerId)
      .eq('existing_salon_id', existingSalonId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) return String(data[0].id);
  }
  if (shopName && shopName.trim()) {
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .select('id')
      .eq('submitted_by_partner_id', partnerId)
      .eq('shop_name', shopName.trim())
      .in('status', OPEN_APPLICATION_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) return String(data[0].id);
  }
  return null;
}

export interface FindOrCreateApplicationOptions {
  partnerId: string;
  /** Canonical salon id when the shop already exists; null for brand-new shops. */
  existingSalonId?: string | null;
  /** Shop name — the de-duplication key for brand-new (salon-less) applications. */
  shopName?: string | null;
  /** Full row values used when inserting a brand-new application. */
  createFields: Record<string, unknown>;
  /** Columns to merge into an existing row (progress fields). Optional. */
  updateFields?: Record<string, unknown>;
}

/**
 * Atomically-aimed find-or-create for `shop_onboarding_applications`.
 *
 * Resolves an existing open application by (in order) `existing_salon_id`, then
 * exact `shop_name` among draft/submitted/changes_requested. If found it is
 * updated (never duplicated); otherwise a single row is inserted. On a
 * concurrent-insert unique violation (see migration unique constraints) it
 * re-fetches and returns the winner, so two callers cannot both insert the same
 * shop. A database transaction is not possible over the client API; the
 * migration's unique indexes are the authoritative guard, this is the client
 * half that makes the common single-writer path deterministic.
 */
export async function findOrCreateShopApplication(
  client: SupabaseClient,
  opts: FindOrCreateApplicationOptions,
): Promise<{ applicationId: string; created: boolean }> {
  const existingId = await findExistingApplication(
    client,
    opts.partnerId,
    opts.existingSalonId,
    opts.shopName,
  );
  if (existingId) {
    const patch = { ...(opts.updateFields ?? {}), ...opts.createFields };
    await client
      .from('shop_onboarding_applications')
      .update(patch)
      .eq('id', existingId)
      .then(undefined, () => undefined); // best-effort progress update
    return { applicationId: existingId, created: false };
  }

  try {
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .insert(opts.createFields)
      .select('id')
      .single();
    if (error) throw error;
    return { applicationId: String(data.id), created: true };
  } catch (err) {
    const apiError = (err as { code?: string; message?: string }) ?? {};
    if (isUniqueViolation(apiError)) {
      const winner = await findExistingApplication(
        client,
        opts.partnerId,
        opts.existingSalonId,
        opts.shopName,
      );
      if (winner) return { applicationId: winner, created: false };
    }
    throw err;
  }
}

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
  // Login fails closed: only a definitive 'authorized' answer grants entry.
  // Session restore uses checkGrowthPartnerAccess directly so 'unknown'
  // (offline) can keep an already-authorized shell alive under RLS.
  const result = await checkGrowthPartnerAccess(client, userId);
  return { allowed: result.state === 'authorized', foundRole: result.foundRole };
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
    .select('id, salon_id, status, attribution_method, effective_from, active_scans')
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
    .select('commission_paise, status, hold_until, created_at')
    .eq('growth_partner_id', partnerId)
    .order('hold_until', { ascending: true });
  if (error) {
    if (isMissingRelationError(error)) {
      return emptyCommissionSummary();
    }
    throw error;
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const summary = emptyCommissionSummary();
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
    } else {
      continue;
    }
    summary.lifetimePaise += amount;
    const created = row.created_at ? new Date(String(row.created_at)).getTime() : NaN;
    if (Number.isFinite(created) && created >= weekAgo) summary.weekPaise += amount;
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
  // Explicit, canonical column mapping — no dynamic key fallbacks. These match
  // the versioned schema in supabase/migrations/001_gp_pwa_schema_and_rls.sql.
  const { data, error } = await client
    .from('partner_payouts')
    .select('id, amount_paise, status, created_at, paid_at')
    .eq('growth_partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    status: String(r.status ?? 'unknown'),
    amountPaise: Number(r.amount_paise ?? 0),
    createdAt: r.created_at ? String(r.created_at) : null,
    paidAt: r.paid_at ? String(r.paid_at) : null,
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
  existingSalonId?: string | null;
  services?: Array<{ name: string; price: string; duration: string }>;
}

/** Strictly-typed salon-setup proposal payload written to the shared project. */
export interface ShopApplicationProposalPayload {
  profile: {
    name: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    area: string;
    city: string;
    opening_hours: { opens: string; closes: string };
  };
  services: Array<{ name: string; price: string; duration: string }>;
  template: { key: string };
}

/**
 * Submit a new shop application + website-setup proposal. Contract mirrors the
 * proven dashboard flow (save_growth_partner_salon_setup RPC).
 * The RPC resolves canonical salon, owner membership, and organization server-side.
 */
export async function submitShopApplication(
  client: SupabaseClient,
  input: ShopApplicationInput,
): Promise<{ applicationId: string }> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  // 1. Resolve the partner identity row. Do NOT invent one — growth_partners
  // is provisioned by Nexora ops together with the permanent role.
  const partner = await resolveGrowthPartner(client, user.id);
  if (!partner) {
    throw new Error(
      'No Growth Partner profile is linked to this account. Nexora ops must assign your partner record before you can onboard shops.',
    );
  }

  const shopName = input.shopName.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const applicationFields = {
    submitted_by_partner_id: partner.id,
    existing_salon_id: input.existingSalonId || null,
    status: 'draft',
    current_step: 6,
    owner_email: ownerEmail,
    owner_phone: input.ownerPhone.trim(),
    shop_name: shopName,
    city: input.city.trim(),
    locality: input.locality.trim(),
    full_address: input.fullAddress.trim(),
    opening_time: input.openingTime,
    closing_time: input.closingTime,
    about_shop: input.aboutShop.trim(),
    website_template: input.websiteTemplate,
  };

  // 2. Atomically-aimed find-or-create — reuse an existing draft/submitted
  // application for this shop instead of inserting a second row. For brand-new
  // shops (existing_salon_id is null) this de-duplicates by exact shop_name
  // among open statuses, so the follow-on Website Onboarding step reuses the
  // SAME application row instead of creating a duplicate.
  const { applicationId } = await findOrCreateShopApplication(client, {
    partnerId: String(partner.id),
    existingSalonId: input.existingSalonId ?? null,
    shopName,
    createFields: applicationFields,
    updateFields: applicationFields,
  });

  // 3. Save the website-setup proposal payload (validated & owner-resolved server-side)
  const payload: ShopApplicationProposalPayload = {
    profile: {
      name: shopName,
      description: input.aboutShop.trim(),
      phone: input.ownerPhone.trim(),
      email: ownerEmail,
      address: input.fullAddress.trim(),
      area: input.locality.trim(),
      city: input.city.trim(),
      opening_hours: { opens: input.openingTime, closes: input.closingTime },
    },
    services: input.services || [],
    template: { key: input.websiteTemplate },
  };
  if (!applicationId) throw new Error('Could not create or reuse a shop application.');
  const { error: proposalErr } = await client.rpc('save_growth_partner_salon_setup', {
    p_application_id: applicationId,
    p_payload: payload,
    p_submit: true,
  });
  if (proposalErr) throw proposalErr;

  return { applicationId };
}

export interface SaveProposalInput {
  applicationId: string;
  /** Strictly-typed proposal payload (see ShopApplicationProposalPayload). */
  payload: ShopApplicationProposalPayload;
  isSubmit: boolean; // false = draft, true = submit for owner approval
}

/**
 * Save Growth Partner salon setup proposal:
 * - isSubmit = false -> status 'draft' (canonical draft persisted in salon_setup_proposals)
 * - isSubmit = true -> status 'submitted' (sent to Shop Owner, records version in salon_setup_proposal_versions)
 * Note: Submitting does NOT make the salon public; owner must review & publish.
 */
export async function saveGrowthPartnerProposal(
  client: SupabaseClient,
  input: SaveProposalInput,
): Promise<{ proposalId: string; status: 'draft' | 'submitted'; message: string }> {
  const { data: proposalId, error } = await client.rpc('save_growth_partner_salon_setup', {
    p_application_id: input.applicationId,
    p_payload: input.payload,
    p_submit: input.isSubmit,
  });
  if (error) throw error;

  const status = input.isSubmit ? 'submitted' : 'draft';
  const message = input.isSubmit
    ? 'Website sent to Shop Owner for approval.'
    : 'Website draft saved successfully in proposals.';

  return {
    proposalId: String(proposalId),
    status,
    message,
  };
}
