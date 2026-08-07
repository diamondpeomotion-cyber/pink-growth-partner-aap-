import React from 'react';
import {
  MapPin,
  Compass,
  Navigation2,
  CheckCircle2,
  AlertTriangle,
  Satellite,
  Loader2,
} from 'lucide-react';
import type { GeoReading, LocationErrorInfo, LocationPermissionStatus } from '../lib/locationService';
import { ACCURACY_THRESHOLD_M } from '../lib/locationService';

// Offline, Google-free location panel. Previously this file embedded a Google
// Maps iframe + external Google link and showed a hardcoded fake
// "26.8521° N, 75.7682° E" footer. All external map/location API usage is
// removed: the panel now visualises the REAL navigator.geolocation fix only.

interface MapPreviewProps {
  fullAddress: string;
  localityName: string;
  cityName: string;
  stateName: string;
  pincode: string;
  landmark?: string;
  /** Same contract as before — but now starts a REAL high-accuracy GPS watch. */
  onDetectLocation?: () => void;
  isDetecting?: boolean;
  /** Accepted fix (accuracy <= 30 m) once locked. */
  accurateFix?: GeoReading | null;
  /** Best raw reading while still hunting (accuracy > 30 m). */
  waitingReading?: GeoReading | null;
  locationError?: LocationErrorInfo | null;
  permissionStatus?: LocationPermissionStatus;
}

const formatCoord = (v: number) => `${Math.abs(v).toFixed(6)}° ${v >= 0 ? 'N' : 'S'}`;
const formatCoordLng = (v: number) => `${Math.abs(v).toFixed(6)}° ${v >= 0 ? 'E' : 'W'}`;
const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function MapPreview({
  fullAddress,
  localityName,
  cityName,
  stateName,
  pincode,
  onDetectLocation,
  isDetecting = false,
  accurateFix = null,
  waitingReading = null,
  locationError = null,
  permissionStatus = 'unknown',
}: MapPreviewProps) {
  const locked = Boolean(accurateFix);
  const denied = permissionStatus === 'denied' || locationError?.code === 'PERMISSION_DENIED';
  // Visual accuracy radius: purely indicative (offline graphic, not a map).
  const accuracy = accurateFix?.accuracy ?? waitingReading?.accuracy ?? null;
  const ringScale = accuracy === null ? 0 : Math.max(18, Math.min(96, accuracy * 1.6));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col transition-all">
      {/* Header / detector bar (unchanged layout) */}
      <div className="p-3 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Navigation2 size={16} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Shop GPS Location</h4>
            <p className="text-[11px] text-gray-500 font-medium line-clamp-1">
              Device GPS se accurate coordinates (no Google API)
            </p>
          </div>
        </div>

        {onDetectLocation && !locked && (
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isDetecting || denied}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Compass size={14} className={isDetecting ? 'animate-spin' : ''} />
            {isDetecting ? 'Locating…' : denied ? 'GPS Blocked' : 'Detect GPS Location'}
          </button>
        )}
        {locked && (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
            <Satellite size={13} /> GPS Locked
          </span>
        )}
      </div>

      {/* Offline visual canvas — no iframe, no tiles, no network calls */}
      <div className="relative w-full h-64 md:h-72 overflow-hidden bg-[#f6f2f0]">
        {/* Faux grid (pure CSS, decorative) */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(#e7e0dd 1px, transparent 1px), linear-gradient(90deg, #e7e0dd 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Accuracy ring + pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          {accuracy !== null && (
            <div
              className={`absolute rounded-full border-2 ${locked ? 'border-emerald-400/60 bg-emerald-300/20' : 'border-amber-400/50 bg-amber-300/15'}`}
              style={{ width: ringScale, height: ringScale }}
            />
          )}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center z-10 animate-bounce">
            <div
              className={`${locked ? 'bg-emerald-600' : 'bg-primary'} text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white flex items-center gap-1 whitespace-nowrap`}
            >
              <MapPin size={12} className="fill-white" />
              {locked ? `Shop Pin · ±${Math.round(accuracy ?? 0)} m` : 'Shop Pin'}
            </div>
            <div className={`w-2 h-2 ${locked ? 'bg-emerald-600' : 'bg-primary'} rotate-45 -mt-1 shadow-md`}></div>
          </div>
        </div>

        {/* Center status overlays */}
        <div className="absolute inset-x-3 top-3 z-20">
          {denied && (
            <div className="bg-rose-50/95 backdrop-blur-md border border-rose-200 text-rose-800 p-3 rounded-xl text-[11px] font-semibold leading-relaxed flex items-start gap-2 shadow-sm">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <span>
                Please enable location to see nearby salons.
                <span className="block text-rose-600/80 font-medium mt-0.5">
                  Browser settings → Site settings → Location → Allow, phir dobara Detect karein.
                </span>
              </span>
            </div>
          )}
          {!denied && isDetecting && !locked && (
            <div className="bg-white/95 backdrop-blur-md border border-amber-200 text-amber-900 p-3 rounded-xl text-[11px] font-semibold leading-relaxed flex items-start gap-2 shadow-sm">
              <Loader2 size={15} className="shrink-0 mt-0.5 animate-spin text-amber-500" />
              <span>
                {waitingReading
                  ? `GPS behtar ho raha hai… accuracy ${Math.round(waitingReading.accuracy)} m (≤ ${ACCURACY_THRESHOLD_M} m ka intezaar)`
                  : 'GPS watch shuru — pehli reading par bharosa nahi karte, accurate fix ka intezaar…'}
              </span>
            </div>
          )}
          {!denied && locationError && locationError.code !== 'PERMISSION_DENIED' && (
            <div className="bg-white/95 backdrop-blur-md border border-amber-200 text-amber-900 p-3 rounded-xl text-[11px] font-semibold leading-relaxed flex items-start gap-2 shadow-sm">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
              <span>{locationError.message}</span>
            </div>
          )}
        </div>

        {/* Address chip (kept, text-only) */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${locked ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-900 truncate">
                  {fullAddress || `${localityName}, ${cityName}`}
                </p>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  {cityName}, {stateName} {pincode ? `- ${pincode}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real coordinates footer (requirement #7 display) */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 font-medium">
        {locked && accurateFix ? (
          <>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-600" /> Accurate fix locked
            </span>
            <span className="text-[10px] text-gray-500 text-right leading-tight">
              {formatCoord(accurateFix.latitude)}, {formatCoordLng(accurateFix.longitude)} · ±{Math.round(accurateFix.accuracy)} m
              <span className="block text-gray-400">{formatTime(accurateFix.timestamp)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1 text-gray-500 font-semibold text-[11px]">
              <Compass size={13} /> GPS fix pending
            </span>
            <span className="text-[10px] text-gray-400">
              {waitingReading
                ? `best so far ±${Math.round(waitingReading.accuracy)} m`
                : 'Detect dabakar shuru karein'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
