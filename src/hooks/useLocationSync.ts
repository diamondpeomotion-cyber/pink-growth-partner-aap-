// Authenticated location synchronization hook (Nexora architecture).
//
// Contract:
//   - Inert unless `enabled` is true AND an authenticated Supabase session
//     exists — anonymous visitors never start a GPS watcher.
//   - Reuses the EXISTING location engine (lib/locationService.ts). It does
//     not implement a second GPS stack and never calls
//     navigator.geolocation.watchPosition directly.
//   - Exactly ONE background sync watcher exists app-wide (module-level
//     registry): re-mounts (React StrictMode) and repeated enables stop the
//     previous watch before starting the next — no duplicate watchers.
//   - Writes go through lib/locationSyncRepository.ts: canonical RPC
//     save_my_private_location (identity derived from auth.uid() inside
//     PostgreSQL) via the shared anon client + user JWT → RLS. No
//     service_role anywhere.
//   - On session start the user's private saved row is restored from the
//     backend into the device fix cache (canonical SharedLocationSync.bind
//     behaviour) and is never re-written back to the backend.
//   - SIGNED_OUT / USER_DELETED / refresh-without-session stop the watcher
//     and unsubscribe immediately (logout cleanup), independent of any React
//     re-render timing.

import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as appSupabase } from '../lib/supabase';
import {
  startAccurateLocationWatch,
  readSavedFix,
  LAST_FIX_STORAGE_KEY,
  type AccurateWatchHandle,
  type GeoReading,
} from '../lib/locationService';
import { syncUserLocation, loadOwnLocation } from '../lib/locationSyncRepository';

export interface UseLocationSyncOptions {
  /** Gate: only synchronize while the caller considers the user signed in. */
  enabled: boolean;
  /** Test seam — defaults to the app-wide Nexora client. */
  client?: SupabaseClient | null;
}

export interface UseLocationSyncResult {
  /** Time (ms epoch) + backend target of the last accepted write. */
  lastSync: { syncedAt: number; target: string } | null;
  /** Last sync failure reason (never contains coordinates). */
  error: string | null;
}

/** Module-level singleton: at most one background sync watcher app-wide. */
const activeSyncWatch: { handle: AccurateWatchHandle | null } = { handle: null };

const MIN_SYNC_INTERVAL_MS = 30_000; // burst guard between backend writes
const MAX_BASELINE_AGE_MS = 24 * 60 * 60 * 1000; // reuse yesterday's fix only

const persistDeviceFix = (fix: GeoReading): void => {
  try {
    window.localStorage.setItem(LAST_FIX_STORAGE_KEY, JSON.stringify(fix));
  } catch {
    /* storage blocked — never fatal */
  }
};

export function useLocationSync({
  enabled,
  client = appSupabase,
}: UseLocationSyncOptions): UseLocationSyncResult {
  const [lastSync, setLastSync] = useState<{ syncedAt: number; target: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !client) return;

    const auth = client.auth;
    let disposed = false;
    let sessionConfirmed = false;
    let lastSyncedAt = 0;
    let restoredFromBackend = false;
    let restoreInFlight = false;

    const pushFix = async (fix: GeoReading, source: 'baseline' | 'watch') => {
      const now = Date.now();
      if (source === 'watch' && now - lastSyncedAt < MIN_SYNC_INTERVAL_MS) return;
      try {
        const outcome = await syncUserLocation(client, fix);
        if (disposed) return;
        if (outcome.synced) {
          lastSyncedAt = now;
          setLastSync({ syncedAt: now, target: String(outcome.target) });
          setError(null);
        } else if (outcome.reason) {
          setError(outcome.reason);
        }
      } catch (err) {
        if (!disposed) setError(`Location sync failed: ${String(err).slice(0, 120)}`);
      }
    };

    // Idempotent stop/start around the singleton slot — never two watchers.
    const stopWatch = () => {
      if (activeSyncWatch.handle) {
        activeSyncWatch.handle.stop();
        activeSyncWatch.handle = null;
      }
    };

    const startWatch = () => {
      stopWatch();
      activeSyncWatch.handle = startAccurateLocationWatch({
        onFix: (fix: GeoReading) => {
          void pushFix(fix, 'watch');
        },
        // The engine already logs + surfaces its own errors; the sync layer
        // keeps waiting for the next reading.
        onError: () => {},
      });
      if (restoredFromBackend) return; // backend row is the baseline
      // Otherwise re-publish the last accepted device fix (fresh ones only)
      // so the backend has a baseline the moment the session becomes active.
      const saved = readSavedFix();
      if (saved && Date.now() - saved.timestamp < MAX_BASELINE_AGE_MS) {
        void pushFix(saved, 'baseline');
      }
    };

    // Establish the session-scoped sync: restore the user's own saved row
    // from the backend (canonical bind() behaviour), then start the watcher.
    // Idempotent under StrictMode/getSession-event races.
    const establishSession = () => {
      sessionConfirmed = true;
      if (restoreInFlight) return;
      restoreInFlight = true;
      void (async () => {
        try {
          const saved = await loadOwnLocation(client);
          if (disposed) return;
          if (saved) {
            restoredFromBackend = true;
            persistDeviceFix(saved);
          }
        } catch {
          /* restore is best-effort — the watch still runs */
        }
        restoreInFlight = false;
        if (!disposed) startWatch();
      })();
    };

    void auth.getSession().then(({ data }) => {
      if (disposed) return;
      if (data.session) establishSession();
    });

    // Immediate cleanup on auth loss — does not wait for a React re-render.
    const { data: subscription } = auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      if (
        event === 'SIGNED_OUT' ||
        (event as string) === 'USER_DELETED' ||
        (event === 'TOKEN_REFRESHED' && !session)
      ) {
        sessionConfirmed = false;
        restoredFromBackend = false;
        stopWatch();
        setError(null);
        return;
      }
      if (session && !sessionConfirmed) {
        establishSession();
      }
    });

    return () => {
      disposed = true;
      subscription.subscription.unsubscribe();
      stopWatch();
    };
  }, [enabled, client]);

  return { lastSync, error };
}
