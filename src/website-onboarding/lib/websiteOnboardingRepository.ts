// Persistence for the Website Onboarding flow.
//
// This layer deliberately reuses the EXISTING Nexora data structures that the
// Growth Partner app already writes to — no new project, no new tables:
//
//   shop_onboarding_applications   one application per (partner, salon)
//   salon_setup_proposals          the setup/website payload + status
//   RPC save_growth_partner_salon_setup(p_application_id, p_payload, p_submit)
//       p_submit=false -> draft, p_submit=true -> submitted for owner approval
//
// The canonical payload keys (`profile`, `services`, `template`) keep exactly
// the shape the previous Website implementation submitted, so the Shop Owner
// review app (review_salon_setup) keeps working unchanged. The richer state
// captured by the new onboarding is stored additively under `onboarding`.
//
// Everything runs on the shared anon client + the signed-in user's session:
// no service-role key, no RLS bypass. Server rejections are surfaced to the UI
// (and the draft is still cached locally) instead of being silently faked.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SalonData } from '../types';
import { createBlankSalonData } from '../types';
import { assertShopBelongsToPartner } from '../../lib/shopContext';

export const ONBOARDING_PAYLOAD_VERSION = 2;

export interface OnboardingRecord {
  /** shop_onboarding_applications.id — null until the first save creates it. */
  applicationId: string | null;
  /** salon_setup_proposals.id when a proposal already exists. */
  proposalId: string | null;
  status: 'none' | 'draft' | 'submitted' | string;
  step: number;
  data: SalonData | null;
  updatedAt: string | null;
  /** Where the returned draft came from (server wins over local cache). */
  source: 'supabase' | 'local' | 'empty';
  /** Non-fatal problem (offline, missing relation, RLS) worth showing. */
  warning: string | null;
}

export interface SaveResult {
  applicationId: string | null;
  proposalId: string | null;
  status: 'draft' | 'submitted' | 'local-only';
  message: string;
  /** true when the payload reached Supabase. */
  persistedRemotely: boolean;
}

const isMissingRelationError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    error.code === 'PGRST202' ||
    /could not find a (table|schema|function)|relation .* does not exist/i.test(error.message || '')
  );
};

// ---------------------------------------------------------------------------
// Shop-scoped local cache (offline resilience only — never a source of truth
// for WHICH shop is active, and never shared between shops).
// ---------------------------------------------------------------------------

const localKey = (userId: string, salonId: string) =>
  `nexora_website_onboarding:${userId}:${salonId}`;

interface LocalDraft {
  step: number;
  data: SalonData;
  savedAt: string;
}

export function readLocalDraft(userId: string, salonId: string): LocalDraft | null {
  try {
    const raw = window.localStorage.getItem(localKey(userId, salonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalDraft>;
    if (!parsed?.data) return null;
    return {
      step: typeof parsed.step === 'number' ? parsed.step : 0,
      data: { ...createBlankSalonData(), ...parsed.data },
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeLocalDraft(
  userId: string,
  salonId: string,
  step: number,
  data: SalonData,
): void {
  try {
    window.localStorage.setItem(
      localKey(userId, salonId),
      JSON.stringify({ step, data, savedAt: new Date().toISOString() } satisfies LocalDraft),
    );
  } catch {
    /* quota / private mode — remote save is still attempted */
  }
}

export function clearLocalDraft(userId: string, salonId: string): void {
  try {
    window.localStorage.removeItem(localKey(userId, salonId));
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// SalonData <-> proposal payload
// ---------------------------------------------------------------------------

const firstOpenDay = (data: SalonData) => {
  const hours = data.openingHours;
  if (!hours) return { opens: '10:00', closes: '20:00' };
  const day = Object.values(hours).find((d) => d?.open) ?? hours.monday;
  return { opens: day?.startTime ?? '10:00', closes: day?.endTime ?? '20:00' };
};

/**
 * Build the proposal payload. The first three keys are the untouched legacy
 * contract; `onboarding` carries the full new-onboarding state additively.
 */
export function buildProposalPayload(
  data: SalonData,
  step: number,
  salonId: string,
): Record<string, unknown> {
  const hours = firstOpenDay(data);
  return {
    profile: {
      name: (data.salonName ?? '').trim(),
      description: (data.about ?? '').trim(),
      phone: (data.phone ?? '').trim(),
      email: (data.email ?? '').trim().toLowerCase(),
      address: (data.address?.fullAddress ?? '').trim(),
      area: (data.address?.area ?? '').trim(),
      city: (data.address?.city ?? '').trim(),
      opening_hours: { opens: hours.opens, closes: hours.closes },
    },
    services: (data.services ?? []).map((s) => ({
      name: s.name,
      price: String(s.price ?? ''),
      duration: String(s.duration ?? ''),
      price_amount: Number(s.price ?? 0),
      duration_minutes: Number(s.duration ?? 0),
      category: s.category ?? '',
      description: s.description ?? '',
      featured: Boolean(s.featured),
    })),
    template: { key: data.templateId ?? 'hair' },
    onboarding: {
      version: ONBOARDING_PAYLOAD_VERSION,
      source: 'website-onboarding',
      salon_id: salonId,
      step,
      updated_at: new Date().toISOString(),
      salon_data: data,
    },
  };
}

/** Pull a stored SalonData back out of whatever payload column exists. */
function extractSalonData(payload: unknown): { data: SalonData | null; step: number } {
  if (!payload || typeof payload !== 'object') return { data: null, step: 0 };
  const p = payload as Record<string, any>;
  const onboarding = p.onboarding;
  if (onboarding && typeof onboarding === 'object' && onboarding.salon_data) {
    return {
      data: { ...createBlankSalonData(), ...(onboarding.salon_data as SalonData) },
      step: typeof onboarding.step === 'number' ? onboarding.step : 0,
    };
  }
  // Legacy payload written by the OLD Website implementation: rebuild what we
  // can so an existing shop does not start from a blank wizard.
  if (p.profile || p.services || p.template) {
    // Blank base, never the template's demo persona: a legacy payload only
    // carried profile/services/template, and the missing fields must stay empty
    // rather than inherit another salon's sample content.
    const blank = createBlankSalonData();
    const legacy: SalonData = {
      ...blank,
      salonName: p.profile?.name || '',
      about: p.profile?.description || '',
      phone: p.profile?.phone || '',
      email: p.profile?.email || '',
      templateId: (p.template?.key as SalonData['templateId']) || blank.templateId,
      address: {
        ...(blank.address ?? {
          fullAddress: '',
          area: '',
          city: '',
          state: '',
          pinCode: '',
        }),
        fullAddress: p.profile?.address || '',
        area: p.profile?.area || '',
        city: p.profile?.city || '',
      },
      services: Array.isArray(p.services)
        ? p.services.map((s: any, i: number) => ({
            id: String(s.id ?? i + 1),
            name: String(s.name ?? ''),
            category: String(s.category ?? 'General'),
            description: String(s.description ?? ''),
            price: toNumber(s.price_amount, s.price, 0),
            duration: toNumber(s.duration_minutes, s.duration, 30),
            featured: Boolean(s.featured),
          }))
        : [],
    };
    return { data: legacy, step: 0 };
  }
  return { data: null, step: 0 };
}

/** Read a numeric field that may be stored as a number or a formatted string. */
function toNumber(primary: unknown, fallback: unknown, dflt: number): number {
  for (const candidate of [primary, fallback]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number(candidate.replace(/[^\d.]/g, ''));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return dflt;
}

/** salon_setup_proposals' payload column name is environment-dependent. */
const PAYLOAD_COLUMN_CANDIDATES = ['payload', 'proposal_payload', 'setup_payload', 'data', 'content'];

function findPayload(row: Record<string, any>): unknown {
  for (const col of PAYLOAD_COLUMN_CANDIDATES) {
    const value = row[col];
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        return JSON.parse(value);
      } catch {
        /* not JSON — keep looking */
      }
    }
  }
  // Last resort: any object column that looks like our payload.
  for (const value of Object.values(row)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      if ('onboarding' in v || 'profile' in v) return v;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

export async function loadWebsiteOnboarding(
  client: SupabaseClient,
  opts: { partnerId: string; salonId: string; userId: string },
): Promise<OnboardingRecord> {
  const { partnerId, salonId, userId } = opts;
  const local = readLocalDraft(userId, salonId);
  const fallback = (warning: string | null): OnboardingRecord => ({
    applicationId: null,
    proposalId: null,
    status: local ? 'draft' : 'none',
    step: local?.step ?? 0,
    data: local?.data ?? null,
    updatedAt: local?.savedAt ?? null,
    source: local ? 'local' : 'empty',
    warning,
  });

  let applicationId: string | null = null;
  try {
    const { data, error } = await client
      .from('shop_onboarding_applications')
      .select('id, status, current_step, created_at')
      .eq('submitted_by_partner_id', partnerId)
      .eq('existing_salon_id', salonId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      if (!isMissingRelationError(error)) {
        return fallback(`Could not read the saved application: ${error.message}`);
      }
    } else if (data && data.length > 0) {
      applicationId = String(data[0].id);
    }
  } catch (err) {
    return fallback(err instanceof Error ? err.message : 'Could not reach Supabase.');
  }

  try {
    const { data, error } = await client
      .from('salon_setup_proposals')
      .select('*')
      .eq('growth_partner_id', partnerId)
      .eq('salon_id', salonId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      if (isMissingRelationError(error)) return { ...fallback(null), applicationId };
      return { ...fallback(`Could not read the saved website draft: ${error.message}`), applicationId };
    }

    const row = (data ?? [])[0] as Record<string, any> | undefined;
    if (!row) return { ...fallback(null), applicationId };

    const extracted = extractSalonData(findPayload(row));
    if (!extracted.data) return { ...fallback(null), applicationId };

    const remoteUpdatedAt = row.updated_at ? String(row.updated_at) : null;
    // Prefer whichever copy is newer so an offline edit is not thrown away.
    const localIsNewer =
      local && remoteUpdatedAt ? new Date(local.savedAt) > new Date(remoteUpdatedAt) : Boolean(local && !remoteUpdatedAt);

    if (localIsNewer && local) {
      return {
        applicationId,
        proposalId: row.id ? String(row.id) : null,
        status: String(row.status ?? 'draft'),
        step: local.step,
        data: local.data,
        updatedAt: local.savedAt,
        source: 'local',
        warning: 'Showing your unsynced local changes (newer than the saved draft).',
      };
    }

    return {
      applicationId,
      proposalId: row.id ? String(row.id) : null,
      status: String(row.status ?? 'draft'),
      step: extracted.step,
      data: extracted.data,
      updatedAt: remoteUpdatedAt,
      source: 'supabase',
      warning: null,
    };
  } catch (err) {
    return {
      ...fallback(err instanceof Error ? err.message : 'Could not reach Supabase.'),
      applicationId,
    };
  }
}

// ---------------------------------------------------------------------------
// Save / submit
// ---------------------------------------------------------------------------

async function ensureApplication(
  client: SupabaseClient,
  opts: { partnerId: string; salonId: string; applicationId: string | null; data: SalonData; step: number },
): Promise<string> {
  if (opts.applicationId) {
    // Best-effort progress update; never block the save on it.
    await client
      .from('shop_onboarding_applications')
      .update({
        current_step: opts.step,
        shop_name: (opts.data.salonName ?? '').trim(),
        website_template: opts.data.templateId ?? 'hair',
      })
      .eq('id', opts.applicationId)
      .then(undefined, () => undefined);
    return opts.applicationId;
  }

  const hours = firstOpenDay(opts.data);
  const { data, error } = await client
    .from('shop_onboarding_applications')
    .insert({
      submitted_by_partner_id: opts.partnerId,
      existing_salon_id: opts.salonId,
      status: 'draft',
      current_step: opts.step,
      owner_email: (opts.data.email ?? '').trim().toLowerCase(),
      owner_phone: (opts.data.phone ?? '').trim(),
      shop_name: (opts.data.salonName ?? '').trim(),
      city: (opts.data.address?.city ?? '').trim(),
      locality: (opts.data.address?.area ?? '').trim(),
      full_address: (opts.data.address?.fullAddress ?? '').trim(),
      opening_time: hours.opens,
      closing_time: hours.closes,
      about_shop: (opts.data.about ?? '').trim(),
      website_template: opts.data.templateId ?? 'hair',
    })
    .select('id')
    .single();
  if (error) throw error;
  return String(data.id);
}

export async function saveWebsiteOnboarding(
  client: SupabaseClient,
  opts: {
    partnerId: string;
    salonId: string;
    userId: string;
    applicationId: string | null;
    data: SalonData;
    step: number;
    submit: boolean;
  },
): Promise<SaveResult> {
  const { partnerId, salonId, userId, data, step, submit } = opts;

  // Allow-list check FIRST — a shop that is not attributed to this partner must
  // not even reach the local cache. RLS is still the authority server-side.
  await assertShopBelongsToPartner(client, partnerId, salonId);

  // Cache next, so nothing is lost if the network call fails.
  writeLocalDraft(userId, salonId, step, data);

  const applicationId = await ensureApplication(client, {
    partnerId,
    salonId,
    applicationId: opts.applicationId,
    data,
    step,
  });

  const payload = buildProposalPayload(data, step, salonId);
  const { data: proposalId, error } = await client.rpc('save_growth_partner_salon_setup', {
    p_application_id: applicationId,
    p_payload: payload,
    p_submit: submit,
  });
  if (error) throw error;

  return {
    applicationId,
    proposalId: proposalId ? String(proposalId) : null,
    status: submit ? 'submitted' : 'draft',
    message: submit
      ? 'Website sent to the Shop Owner for approval.'
      : 'Website draft saved to Supabase.',
    persistedRemotely: true,
  };
}
