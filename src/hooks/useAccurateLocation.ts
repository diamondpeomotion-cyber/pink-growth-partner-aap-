// React binding for the accurate location engine (lib/locationService).
// start() must be called (usually from a user tap); stop() clears the watch.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  startAccurateLocationWatch,
  readSavedFix,
  GeoReading,
  LocationErrorInfo,
  LocationPermissionStatus,
  AccurateWatchHandle,
} from '../lib/locationService';

export type AccurateLocationStatus =
  | 'idle'       // not started
  | 'locating'   // watch active, no fix yet (or only inaccurate readings)
  | 'locked'     // accepted fix available (accuracy <= 30 m)
  | 'denied'     // permission denied
  | 'error';     // other graceful error

export interface UseAccurateLocation {
  status: AccurateLocationStatus;
  fix: GeoReading | null;               // last ACCEPTED fix (lat/lng/accuracy/timestamp)
  lastReading: GeoReading | null;       // best raw reading so far (progress UI)
  error: LocationErrorInfo | null;
  permissionStatus: LocationPermissionStatus;
  start: () => void;
  stop: () => void;
}

export function useAccurateLocation(): UseAccurateLocation {
  // A previously ACCEPTED fix survives page reloads (localStorage). It is
  // already accuracy-gated (<=30 m by construction), so it can be served as
  // 'locked' immediately until the watch reports a >100 m movement.
  // (Lazy state initializer — the storage read is not a render-time ref
  // access, keeping the react-hooks v7 refs rule satisfied.)
  const [initialFix] = useState<GeoReading | null>(() => readSavedFix());
  const [status, setStatus] = useState<AccurateLocationStatus>(initialFix ? 'locked' : 'idle');
  const [fix, setFix] = useState<GeoReading | null>(initialFix);
  const [lastReading, setLastReading] = useState<GeoReading | null>(null);
  const [error, setError] = useState<LocationErrorInfo | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('unknown');
  const handleRef = useRef<AccurateWatchHandle | null>(null);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setStatus((s) => (s === 'locked' ? s : 'idle'));
  }, []);

  const start = useCallback(() => {
    handleRef.current?.stop();
    setError(null);
    // Keep a previously SAVED accepted fix as 'locked' — the watch treats it as
    // the movement baseline, so no new onFix fires until the user moves >100 m,
    // and we must not flash 'locating' over an already-valid fix.
    setStatus((s) => (s === 'locked' ? s : 'locating'));
    handleRef.current = startAccurateLocationWatch({
      onReading: (r) => {
        setLastReading((prev) => (!prev || r.accuracy <= prev.accuracy ? r : prev));
      },
      onWaiting: () => setStatus((s) => (s === 'locked' ? s : 'locating')),
      onFix: (f) => {
        setFix(f);
        setError(null);
        setStatus('locked');
      },
      onError: (e) => {
        setError(e);
        if (e.code === 'PERMISSION_DENIED') setStatus('denied');
        else setStatus((s) => (s === 'locked' ? s : 'error'));
      },
      onPermission: (p) => setPermissionStatus(p),
    });
  }, []);

  // Clean up the GPS watch when the owning screen unmounts.
  useEffect(() => () => handleRef.current?.stop(), []);

  return { status, fix, lastReading, error, permissionStatus, start, stop };
}
