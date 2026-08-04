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
 * legacy label for the same role).
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
        .select('id, name, city, area')
        .in('id', salonIds);
      const byId = new Map((salons ?? []).map((s: any) => [s.id, s]));
      for (const row of rows) {
        const salon = byId.get(row.salon_id);
        if (salon) {
          row.salon_name = salon.name;
          row.salon_city = salon.city;
          row.salon_area = salon.area;
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
