// Authenticated location synchronization with the Nexora Supabase backend.
//
// CANONICAL TARGET (Phase 7 shared location security — verified LIVE):
//   Table  public.user_private_locations
//     user_id (PK/FK auth.users), latitude, longitude, accuracy_m,
//     altitude_m, altitude_accuracy_m, speed_mps, heading_degrees,
//     captured_at, updated_at
//     — verified 2026-08-25 against https://qwaehqsmodekbgvnaavz.supabase.co:
//       all ten columns resolve in the PostgREST schema cache; anon SELECT is
//       denied (42501) exactly as the migration's `revoke all from anon`
//       requires.
//   Save   RPC public.save_my_private_location(
//            p_latitude, p_longitude, p_accuracy_m,
//            p_altitude_m, p_altitude_accuracy_m, p_speed_mps,
//            p_heading_degrees, p_captured_at)
//     — verified LIVE: the parameterized function is present in the schema
//       cache (PGRST202 for the zero-parameter signature).
//     Identity is derived INSIDE PostgreSQL from auth.uid(); the browser
//     never sends a target user_id and the RPC raises 42501 when
//     unauthenticated.
//   Clear  RPC public.clear_my_private_location()
//     — verified LIVE: present, EXECUTE denied to anon (42501).
//   RLS    four policies on user_private_locations scoping
//     select/insert/update/delete to user_id = auth.uid() for the
//     authenticated role; anon/service-role path untouched by this app.
//
// This repository therefore uses ONLY the shared anon client carrying the
// signed-in user's JWT. No service_role key, no admin endpoint, no RLS
// bypass. Legacy targets (user_locations, profiles) remain as last-resort
// fallbacks for environments where the canonical objects are absent, and
// every fallback still runs through the authenticated client + RLS.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeoReading } from './locationService';
import { logGeoEvent } from './locationService';

export interface LocationSyncOutcome {
  synced: boolean;
  /** Which backend target accepted the write. */
  target: string | null;
  /** Human-safe reason when nothing was written (never coordinates). */
  reason: string | null;
}

/** PostgREST/SQL errors that mean "this target does not exist with the
 *  expected shape in this project" — skip to the next candidate. */
const isMissingTarget = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === 'PGRST202' || // RPC name exists but signature differs
    error.code === 'PGRST204' || // column missing
    error.code === 'PGRST205' || // table missing
    error.code === '42P01' || // relation missing (SQL)
    error.code === '42P10' || // no unique constraint for upsert onConflict
    error.code === '42703' || // column missing (SQL)
    /column .* does not exist|relation .* does not exist|could not find the (table|function)/i.test(
      error.message ?? '',
    )
  );
};

const isValidSavedRow = (row: Record<string, unknown> | null): row is {
  latitude: number;
  longitude: number;
  accuracy_m: number;
  captured_at: string;
} => {
  if (!row) return false;
  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  const accuracy = Number(row.accuracy_m);
  const capturedAt = row.captured_at;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return false;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) return false;
  if (typeof capturedAt !== 'string') return false;
  const timestamp = Date.parse(capturedAt);
  if (!Number.isFinite(timestamp)) return false;
  return true;
};

/**
 * Canonical save: RPC `save_my_private_location` — identity from auth.uid().
 * The RPC validates coordinates (range + not (0,0)), accuracy (0–100) and
 * timestamp (not in the future) server-side before upserting the row.
 */
export async function syncUserLocation(
  client: SupabaseClient,
  reading: GeoReading,
): Promise<LocationSyncOutcome> {
  // Server-side identity validation before any write. A session that exists
  // only in storage but is expired/revoked stops here.
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (!user) {
    logGeoEvent('location-sync-skipped', {
      reason: userError ? 'auth-validation-failed' : 'no-authenticated-user',
    });
    return { synced: false, target: null, reason: 'No authenticated user.' };
  }

  const accuracyM = Math.round(reading.accuracy);

  // 1. Canonical save RPC (no target user id — auth.uid() server-side).
  try {
    const { error } = await client.rpc('save_my_private_location', {
      p_latitude: reading.latitude,
      p_longitude: reading.longitude,
      p_accuracy_m: accuracyM,
      p_altitude_m: null,
      p_altitude_accuracy_m: null,
      p_speed_mps: null,
      p_heading_degrees: null,
      p_captured_at: new Date(reading.timestamp).toISOString(),
    });
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'save_my_private_location', accuracyM });
      return { synced: true, target: 'save_my_private_location', reason: null };
    }
    if (!isMissingTarget(error)) {
      logGeoEvent('location-sync-rejected', {
        target: 'save_my_private_location',
        code: error.code ?? 'none',
      });
      return { synced: false, target: null, reason: 'Location sync rejected by backend (RLS/grants).' };
    }
  } catch (err) {
    logGeoEvent('location-sync-error', {
      target: 'save_my_private_location',
      detail: String(err).slice(0, 120),
    });
  }

  // 2. Direct upsert into the canonical table (RLS: user_id = auth.uid()).
  try {
    const { error } = await client.from('user_private_locations').upsert(
      {
        user_id: user.id,
        latitude: reading.latitude,
        longitude: reading.longitude,
        accuracy_m: accuracyM,
        captured_at: new Date(reading.timestamp).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'user_private_locations', accuracyM });
      return { synced: true, target: 'user_private_locations', reason: null };
    }
    if (!isMissingTarget(error)) {
      logGeoEvent('location-sync-rejected', {
        target: 'user_private_locations',
        code: error.code ?? 'none',
      });
      return { synced: false, target: null, reason: 'Location sync rejected by backend (RLS/grants).' };
    }
  } catch (err) {
    logGeoEvent('location-sync-error', {
      target: 'user_private_locations',
      detail: String(err).slice(0, 120),
    });
  }

  // 3. Legacy fallback — pre-Phase-7 parallel table (user_id, latitude,
  //    longitude exist live; accuracy/timestamp columns differ per project).
  try {
    const { error } = await client.from('user_locations').upsert(
      {
        user_id: user.id,
        latitude: reading.latitude,
        longitude: reading.longitude,
        recorded_at: new Date(reading.timestamp).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'user_locations', accuracyM });
      return { synced: true, target: 'user_locations', reason: null };
    }
    if (!isMissingTarget(error)) {
      logGeoEvent('location-sync-rejected', { target: 'user_locations', code: error.code ?? 'none' });
      return { synced: false, target: null, reason: 'Location sync rejected by backend (RLS/grants).' };
    }
  } catch (err) {
    logGeoEvent('location-sync-error', { target: 'user_locations', detail: String(err).slice(0, 120) });
  }

  // 4. Final fallback — the user's own profiles row (RLS-gated by the
  //    project's profiles_update_own policy).
  try {
    const { error } = await client
      .from('profiles')
      .update({
        latitude: reading.latitude,
        longitude: reading.longitude,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'profiles', accuracyM });
      return { synced: true, target: 'profiles', reason: null };
    }
    if (!isMissingTarget(error)) {
      logGeoEvent('location-sync-rejected', { target: 'profiles', code: error.code ?? 'none' });
      return { synced: false, target: null, reason: 'Location sync rejected by backend (RLS/grants).' };
    }
  } catch (err) {
    logGeoEvent('location-sync-error', { target: 'profiles', detail: String(err).slice(0, 120) });
  }

  logGeoEvent('location-sync-skipped', { reason: 'no-matching-backend-target' });
  return {
    synced: false,
    target: null,
    reason: 'No matching location target in the Nexora project (schema/RLS).',
  };
}

/**
 * Load this user's private saved location from the canonical table
 * (RLS: user_id = auth.uid()). Returns null when absent/invalid — never a
 * fabricated fallback.
 */
export async function loadOwnLocation(
  client: SupabaseClient,
): Promise<GeoReading | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  try {
    const { data, error } = await client
      .from('user_private_locations')
      .select('latitude,longitude,accuracy_m,captured_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      if (!isMissingTarget(error)) {
        logGeoEvent('location-load-rejected', { code: error.code ?? 'none' });
      }
      return null;
    }
    if (!isValidSavedRow(data as Record<string, unknown> | null)) return null;
    const row = data as { latitude: number; longitude: number; accuracy_m: number; captured_at: string };
    return {
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy_m,
      timestamp: Date.parse(row.captured_at),
    };
  } catch (err) {
    logGeoEvent('location-load-error', { detail: String(err).slice(0, 120) });
    return null;
  }
}

/** Best-effort removal of the user's private location row (auth.uid() RPC). */
export async function clearOwnLocation(client: SupabaseClient): Promise<void> {
  try {
    await client.rpc('clear_my_private_location');
  } catch {
    /* best-effort — RLS still owns the row */
  }
}
