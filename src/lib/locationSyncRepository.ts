// Authenticated location synchronization with the Nexora Supabase backend.
//
// Security contract (mirrors lib/shopContext.ts):
//   - Uses ONLY the shared anon client carrying the signed-in user's JWT.
//     No service_role key, no admin endpoint, no RLS bypass — every write is
//     subject to the project's existing row-level security exactly like any
//     other app write.
//   - Only accepted fixes are synced (accuracy <= 30 m, and > 100 m movement
//     from the last accepted fix) — the engine in lib/locationService.ts has
//     already applied those gates before onFix fires.
//   - The backend targets are resolved defensively: the exact location table
//     of the shared project is not introspectable from the browser, so the
//     repository tries the canonical Nexora candidates in order and degrades
//     silently (logged, never surfaced as fake success) when none matches.
//     Schema-mismatch errors are not retried and never block the app.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeoReading } from './locationService';
import { logGeoEvent } from './locationService';

export interface LocationSyncOutcome {
  synced: boolean;
  /** Which backend target accepted the write ('user_locations' | 'profiles'). */
  target: string | null;
  /** Human-safe reason when nothing was written (never coordinates). */
  reason: string | null;
}

/** PostgREST/RLS errors that mean "this target shape does not match this
 *  project" — skip to the next candidate instead of treating as failure. */
const isSchemaMismatch = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === 'PGRST204' || // column missing
    error.code === 'PGRST205' || // table missing
    error.code === '42P01' || // relation missing (SQL)
    error.code === '42P10' || // no unique constraint for upsert onConflict
    error.code === '42703' || // column missing (SQL)
    /column .* does not exist|relation .* does not exist|could not find the table/i.test(
      error.message ?? '',
    )
  );
};

const toPayload = (reading: GeoReading) => ({
  latitude: reading.latitude,
  longitude: reading.longitude,
  accuracy_m: Math.round(reading.accuracy),
  recorded_at: new Date(reading.timestamp).toISOString(),
});

/**
 * Push one accepted GPS fix to the Nexora backend for the signed-in user.
 * Returns an explicit outcome; never throws for schema/RLS/network issues.
 */
export async function syncUserLocation(
  client: SupabaseClient,
  reading: GeoReading,
): Promise<LocationSyncOutcome> {
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

  const payload = { user_id: user.id, ...toPayload(reading), updated_at: new Date().toISOString() };

  // Candidate 1 — dedicated per-user location row (canonical Nexora target).
  try {
    const { error } = await client.from('user_locations').upsert(payload, {
      onConflict: 'user_id',
    });
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'user_locations', accuracyM: payload.accuracy_m });
      return { synced: true, target: 'user_locations', reason: null };
    }
    if (!isSchemaMismatch(error)) {
      logGeoEvent('location-sync-rejected', { target: 'user_locations', code: error.code ?? 'none' });
      return { synced: false, target: null, reason: 'Location sync rejected by backend (RLS/grants).' };
    }
  } catch (err) {
    logGeoEvent('location-sync-error', { target: 'user_locations', detail: String(err).slice(0, 120) });
  }

  // Candidate 2 — the user's own profiles row (already RLS-gated by the
  // project's profiles_update_own policy for the other profile edits).
  try {
    const { error } = await client
      .from('profiles')
      .update({ ...toPayload(reading), location_updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (!error) {
      logGeoEvent('location-sync-ok', { target: 'profiles', accuracyM: payload.accuracy_m });
      return { synced: true, target: 'profiles', reason: null };
    }
    if (!isSchemaMismatch(error)) {
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
    reason: 'No matching location table in the Nexora project (schema/RLS).',
  };
}
