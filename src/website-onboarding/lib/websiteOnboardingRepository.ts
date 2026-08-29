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
import { findOrCreateShopApplication } from '../../lib/gpRepository';

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

/**
 * Strictly-typed shape of the `salon_setup_proposals.payload` JSONB column
 * (canonical column defined in supabase/migrations/001_gp_pwa_schema_and_rls.sql).
 * The first three keys are the untouched legacy contract; `onboarding` carries
 * the full new-onboarding state additively.
 */
export interface SalonSetupProposalPayload {
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
  services: Array<{
    id?: string;
    name: string;
    price: string;
    duration: string;
    price_amount: number;
    duration_minutes: number;
    category: string;
    description: string;
    featured: boolean;
  }>;
  template: { key: string };
  onboarding: {
    version: number;
    source: 'website-onboarding';
    salon_id: string;
    step: number;
    updated_at: string;
    salon_data: SalonData;
  };
}

const firstOpenDay = (data: SalonData) => {
  const hours = data.openingHours;
  if (!hours) return { opens: '10:00', closes: '20:00' };
  const day = Object.values(hours).find((d) => d?.open) ?? hours.monday;
  return { opens: day?.startTime ?? '10:00', closes: day?.endTime ?? '20:00' };
};

/**
 * Build the strictly-typed proposal payload written to
 * `salon_setup_proposals.payload`.
 */
export function buildProposalPayload(
  data: SalonData,
  step: number,
  salonId: string,
): SalonSetupProposalPayload {
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

/**
 * Parse the `payload` column (JSONB object or JSON string) into a typed
 * payload object. No dynamic column-name probing — the canonical column is
 * `payload` (see migration). Returns null when it cannot be read as a payload.
 */
function parsePayload(raw: unknown): SalonSetupProposalPayload | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return null;
    try {
      return JSON.parse(trimmed) as SalonSetupProposalPayload;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as SalonSetupProposalPayload;
  }
  return null;
}

/** Pull a stored SalonData back out of the typed payload. */
function extractSalonData(payload: SalonSetupProposalPayload | null): { data: SalonData | null; step: number } {
  if (!payload) return { data: null, step: 0 };
  const onboarding = payload.onboarding;
  if (onboarding && typeof onboarding === 'object' && onboarding.salon_data) {
    return {
      data: { ...createBlankSalonData(), ...(onboarding.salon_data as SalonData) },
      step: typeof onboarding.step === 'number' ? onboarding.step : 0,
    };
  }
  // Legacy payload written by the OLD Website implementation: rebuild what we
  // can so an existing shop does not start from a blank wizard.
  if (payload.profile || payload.services || payload.template) {
    // Blank base, never the template's demo persona: a legacy payload only
    // carried profile/services/template, and the missing fields must stay empty
    // rather than inherit another salon's sample content.
    const blank = createBlankSalonData();
    const legacy: SalonData = {
      ...blank,
      salonName: payload.profile?.name || '',
      about: payload.profile?.description || '',
      phone: payload.profile?.phone || '',
      email: payload.profile?.email || '',
      templateId: (payload.template?.key as SalonData['templateId']) || blank.templateId,
      address: {
        ...(blank.address ?? {
          fullAddress: '',
          area: '',
          city: '',
          state: '',
          pinCode: '',
        }),
        fullAddress: payload.profile?.address || '',
        area: payload.profile?.area || '',
        city: payload.profile?.city || '',
      },
      services: Array.isArray(payload.services)
        ? payload.services.map((s, i: number) => ({
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
      .select('id, growth_partner_id, salon_id, application_id, status, payload, submitted_at, created_at, updated_at')
      .eq('growth_partner_id', partnerId)
      .eq('salon_id', salonId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      if (isMissingRelationError(error)) return { ...fallback(null), applicationId };
      return { ...fallback(`Could not read the saved website draft: ${error.message}`), applicationId };
    }

    const row = (data ?? [])[0] as Record<string, unknown> | undefined;
    if (!row) return { ...fallback(null), applicationId };

    const extracted = extractSalonData(parsePayload(row.payload));
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
  const shopName = (opts.data.salonName ?? '').trim();
  const progressFields = {
    current_step: opts.step,
    shop_name: shopName,
    website_template: opts.data.templateId ?? 'hair',
  };

  if (opts.applicationId) {
    // Best-effort progress update; never block the save on it.
    await client
      .from('shop_onboarding_applications')
      .update(progressFields)
      .eq('id', opts.applicationId)
      .then(undefined, () => undefined);
    return opts.applicationId;
  }

  // Reuse the shared find-or-create so an application created by the AddShop
  // flow (a brand-new shop whose existing_salon_id is null) is found again here
  // by exact shop_name instead of inserting a duplicate row. See
  // gpRepository.findOrCreateShopApplication.
  const hours = firstOpenDay(opts.data);
  const { applicationId } = await findOrCreateShopApplication(client, {
    partnerId: opts.partnerId,
    existingSalonId: opts.salonId,
    shopName,
    updateFields: progressFields,
    createFields: {
      submitted_by_partner_id: opts.partnerId,
      existing_salon_id: opts.salonId,
      status: 'draft',
      current_step: opts.step,
      owner_email: (opts.data.email ?? '').trim().toLowerCase(),
      owner_phone: (opts.data.phone ?? '').trim(),
      shop_name: shopName,
      city: (opts.data.address?.city ?? '').trim(),
      locality: (opts.data.address?.area ?? '').trim(),
      full_address: (opts.data.address?.fullAddress ?? '').trim(),
      opening_time: hours.opens,
      closing_time: hours.closes,
      about_shop: (opts.data.about ?? '').trim(),
      website_template: opts.data.templateId ?? 'hair',
    },
  });
  return applicationId;
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
