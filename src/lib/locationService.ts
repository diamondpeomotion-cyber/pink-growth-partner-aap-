// Accurate location engine — browser-only GPS via navigator.geolocation.
//
// Locked requirements implemented here:
//  - watchPosition() (never getCurrentPosition), options EXACTLY
//    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
//  - the first GPS reading is NOT trusted: fixes are only ACCEPTED once
//    accuracy <= 30 m; until then we keep waiting for a better fix
//  - an accepted fix is saved as { latitude, longitude, accuracy, timestamp }
//  - after acceptance, new fixes are emitted only when the user moved > 100 m
//    (Haversine) from the last accepted fix
//  - permission denied / unavailable / timeout are mapped to graceful errors
//  - every event is logged: lat, lng, accuracy, permission, provider, timestamp
//  - no Google Geolocation / no API keys / no external location services

import { haversineMeters } from '../utils/geo';

export const ACCURACY_THRESHOLD_M = 30;
export const MIN_MOVEMENT_M = 100;
export const WATCH_SOFT_CAP_MS = 60000; // keep waiting, but surface progress hint
export const LAST_FIX_STORAGE_KEY = 'nexora_last_accurate_fix';

export interface GeoReading {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number; // ms epoch (device time of the fix)
}

export type LocationPermissionStatus = 'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown';

export type LocationErrorCode = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED' | 'UNKNOWN';

export interface LocationErrorInfo {
  code: LocationErrorCode;
  message: string;
  raw?: unknown;
}

export const PERMISSION_DENIED_MESSAGE = 'Please enable location to see nearby salons.';

const GPS_PROVIDER_LABEL = 'navigator.geolocation (device GPS/network)';

export function logGeoEvent(event: string, details: Record<string, unknown>): void {
  // Single structured log line per requirement #12.
  console.info('[NexoraGeo]', {
    event,
    provider: GPS_PROVIDER_LABEL,
    time: new Date().toISOString(),
    ...details,
  });
}

export function readSavedFix(): GeoReading | null {
  try {
    const raw = localStorage.getItem(LAST_FIX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      typeof parsed.accuracy === 'number' &&
      typeof parsed.timestamp === 'number'
    ) {
      return parsed as GeoReading;
    }
  } catch {
    /* corrupted cache — ignore */
  }
  return null;
}

function saveFix(fix: GeoReading): void {
  try {
    localStorage.setItem(LAST_FIX_STORAGE_KEY, JSON.stringify(fix));
  } catch {
    /* storage full/blocked — never fatal */
  }
}

export interface AccurateWatchCallbacks {
  /** Every raw GPS update (accepted or not) — for UI progress + logging. */
  onReading?: (reading: GeoReading) => void;
  /** Reading arrived but accuracy still worse than 30 m — waiting continues. */
  onWaiting?: (reading: GeoReading) => void;
  /** Accepted fix (accuracy <= 30 m, and >100 m from previous fix). */
  onFix?: (fix: GeoReading) => void;
  /** Accurate fix arrived but user moved <100 m — intentionally not emitted. */
  onMovementIgnored?: (fix: GeoReading, movedMeters: number) => void;
  onError?: (error: LocationErrorInfo) => void;
  onPermission?: (status: LocationPermissionStatus) => void;
}

export interface AccurateWatchHandle {
  stop: () => void;
}

const toReading = (pos: GeolocationPosition): GeoReading => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy,
  timestamp: pos.timestamp,
});

const mapErrorCode = (code: number): LocationErrorCode =>
  code === 1 ? 'PERMISSION_DENIED' : code === 2 ? 'POSITION_UNAVAILABLE' : code === 3 ? 'TIMEOUT' : 'UNKNOWN';

/** Query + observe the geolocation permission state (best-effort). */
export async function watchPermissionStatus(cb: (s: LocationPermissionStatus) => void): Promise<() => void> {
  if (!('permissions' in navigator)) {
    cb('unknown');
    return () => {};
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    const report = () => {
      const s = status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'prompt';
      logGeoEvent('permission', { permissionStatus: s });
      cb(s);
    };
    report();
    status.addEventListener('change', report);
    return () => status.removeEventListener('change', report);
  } catch {
    cb('unknown');
    return () => {};
  }
}

/**
 * Start the spec-compliant accurate watch. Returns a handle with stop().
 * Engine keeps collecting GPS updates until accuracy <= 30 m (never uses the
 * first reading blindly), then emits only meaningful (>100 m) movements.
 */
export function startAccurateLocationWatch(callbacks: AccurateWatchCallbacks): AccurateWatchHandle {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    const error: LocationErrorInfo = {
      code: 'UNSUPPORTED',
      message: 'Is device/browser me GPS location supported nahi hai.',
    };
    logGeoEvent('unsupported', {});
    callbacks.onError?.(error);
    return { stop: () => {} };
  }

  let watchId: number | null = null;
  let stopped = false;
  let lastAccepted: GeoReading | null = readSavedFix();
  let permissionStatus: LocationPermissionStatus = 'unknown';
  let softCapTimer: ReturnType<typeof setTimeout> | null = null;
  let stopPermissionWatch: (() => void) | null = null;

  void watchPermissionStatus((s) => {
    permissionStatus = s;
    callbacks.onPermission?.(s);
  }).then((unsub) => {
    stopPermissionWatch = unsub;
    if (stopped) unsub();
  });

  const handleSuccess = (pos: GeolocationPosition) => {
    if (stopped) return;
    const reading = toReading(pos);
    logGeoEvent('gps-reading', {
      latitude: reading.latitude,
      longitude: reading.longitude,
      accuracyM: Math.round(reading.accuracy),
      permissionStatus,
      fixTimestamp: new Date(reading.timestamp).toISOString(),
    });
    callbacks.onReading?.(reading);

    // Requirement #6: reject the first/inaccurate readings, keep waiting.
    if (reading.accuracy > ACCURACY_THRESHOLD_M) {
      logGeoEvent('fix-rejected', {
        reason: `accuracy ${Math.round(reading.accuracy)}m > ${ACCURACY_THRESHOLD_M}m — better fix ka intezaar`,
        accuracyM: Math.round(reading.accuracy),
      });
      callbacks.onWaiting?.(reading);
      return;
    }

    // Requirement #10: refresh only when the user moved >100 m.
    if (lastAccepted) {
      const moved = haversineMeters(lastAccepted, reading);
      if (moved <= MIN_MOVEMENT_M) {
        logGeoEvent('fix-ignored-small-move', {
          movedM: Math.round(moved),
          thresholdM: MIN_MOVEMENT_M,
        });
        callbacks.onMovementIgnored?.(reading, moved);
        return;
      }
    }

    lastAccepted = reading;
    saveFix(reading);
    logGeoEvent('fix-accepted', {
      latitude: reading.latitude,
      longitude: reading.longitude,
      accuracyM: Math.round(reading.accuracy),
      permissionStatus,
      fixTimestamp: new Date(reading.timestamp).toISOString(),
    });
    callbacks.onFix?.(reading);
  };

  const handleError = (err: GeolocationPositionError) => {
    if (stopped) return;
    const code = mapErrorCode(err.code);
    const message =
      code === 'PERMISSION_DENIED'
        ? PERMISSION_DENIED_MESSAGE
        : code === 'POSITION_UNAVAILABLE'
          ? 'GPS signal abhi available nahi hai (indoor/weak signal) — thodi der me dobara try karein.'
          : code === 'TIMEOUT'
            ? 'Accurate GPS fix lene me time lag raha hai — khuli jagah/outdoor me try karein.'
            : 'Location fetch nahi ho payi. Dobara try karein.';
    logGeoEvent('gps-error', { code, permissionStatus, rawMessage: err.message });
    callbacks.onError?.({ code, message, raw: err });
  };

  watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
    // Requirement #5 — exact locked options.
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  });
  logGeoEvent('watch-started', {
    options: { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    permissionStatus,
  });

  // Graceful progress hint if a sub-30 m fix takes unusually long. The watch
  // itself CONTINUES (requirement #6: keep waiting for a better fix).
  softCapTimer = setTimeout(() => {
    if (!stopped) {
      logGeoEvent('fix-slow', { waitedMs: WATCH_SOFT_CAP_MS });
      callbacks.onError?.({
        code: 'TIMEOUT',
        message: 'Accurate GPS fix me deri ho rahi hai — khula aasman/outdoor behtar signal deta hai. Watch abhi bhi chalu hai.',
      });
    }
  }, WATCH_SOFT_CAP_MS);

  return {
    stop: () => {
      stopped = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (softCapTimer) clearTimeout(softCapTimer);
      stopPermissionWatch?.();
      logGeoEvent('watch-stopped', {});
    },
  };
}
