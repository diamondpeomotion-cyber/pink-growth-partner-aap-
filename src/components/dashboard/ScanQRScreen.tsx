import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, CameraOff, ScanLine, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchMyAttributions } from '../../lib/gpRepository';

type QRReaderInstance = {
  decodeFromVideoElementContinuously: (
    element: HTMLVideoElement,
    cb: (result: { getText(): string } | null) => void,
  ) => Promise<void>;
  stopContinuousDecode: () => void;
  reset: () => void;
};

export default function ScanQRScreen({ onBack }: { onBack: () => void }) {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultIsError, setResultIsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<QRReaderInstance | null>(null);

  const lookup = useCallback(async (code: string) => {
    const needle = code.trim();
    if (!needle) return;
    if (!supabase) {
      setResult('Supabase is not configured.');
      setResultIsError(true);
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResult('Sign in required.');
        setResultIsError(true);
        return;
      }
      const partner = await resolveGrowthPartner(supabase, user.id);
      if (!partner) {
        setResult('No Growth Partner profile is linked to this account.');
        setResultIsError(true);
        return;
      }
      const rows = await fetchMyAttributions(supabase, String(partner.id));
      const match = rows.find(
        (r) =>
          String(r.salon_id) === needle ||
          String(r.id) === needle ||
          (r.salon_name || '').toLowerCase() === needle.toLowerCase(),
      );
      if (match) {
        setResult(`✓ Matched attributed shop: ${match.salon_name || match.salon_id} (${match.status}).`);
        setResultIsError(false);
      } else {
        setResult('No attributed shop matches that code. Check the code and try again.');
        setResultIsError(true);
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Lookup failed.');
      setResultIsError(true);
    } finally {
      setBusy(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    readerRef.current?.stopContinuousDecode();
    readerRef.current?.reset();
    readerRef.current = null;
    setCameraActive(false);
    setCameraStatus(null);
    // Stop the video tracks explicitly as a fallback.
    const v = videoRef.current;
    if (v && v.srcObject) {
      const stream = v.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!supabase || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported in this browser or environment.');
      setCameraStatus(null);
      return;
    }
    setCameraError(null);
    setCameraStatus('Requesting camera permission…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCameraStatus('Scanning… point the camera at a shop QR code.');

      // Code-split @zxing/library so the heavy decoder is only downloaded when
      // the user actually starts the scanner.
      const { BrowserQRCodeReader } = await import('@zxing/library');
      const reader = new BrowserQRCodeReader() as unknown as QRReaderInstance;
      readerRef.current = reader;
      // Continuous decode from the live video element.
      await reader.decodeFromVideoElementContinuously(videoRef.current as HTMLVideoElement, (result) => {
        const text = result?.getText();
        if (text) {
          setCameraStatus(null);
          void lookup(text);
          // A short lock prevents duplicate lookups of the same frame.
          setTimeout(() => setCameraStatus('Scanning… point the camera at a shop QR code.'), 1500);
        }
      });
    } catch (err) {
      console.warn('Camera start failed:', err);
      setCameraError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Enable camera access in your browser and try again.'
          : 'Could not start the camera. Check permissions and try again.',
      );
      setCameraActive(false);
      setCameraStatus(null);
    }
  }, [lookup]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1b] pb-24">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-primary">Scan Shop QR</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-[var(--page-margin)] pt-8 space-y-6">
        {/* Camera scanner panel */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="relative w-full max-w-sm aspect-square bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />
            {!cameraActive && (
              <div className="text-white/70 flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Camera size={36} />
                </div>
                <p className="text-xs font-semibold px-6">Enable the camera to scan a shop QR code automatically.</p>
              </div>
            )}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <ScanLine size={64} className="text-primary/80 animate-pulse" />
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-sm">
            {cameraStatus && <p className="text-xs text-gray-600 font-medium">{cameraStatus}</p>}
            {cameraError && <p className="text-xs text-rose-600 font-semibold">{cameraError}</p>}
            <button
              onClick={cameraActive ? stopCamera : () => void startCamera()}
              className="w-full bg-primary text-white px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-pink-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cameraActive ? <CameraOff size={16} /> : <Camera size={16} />}
              {cameraActive ? 'Stop Scanner' : 'Start Scanner'}
            </button>
          </div>
        </div>

        {/* Manual lookup */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2 text-sm">Shop code or name</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="salon id or shop name"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void lookup(manualCode); }}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              disabled={busy}
              onClick={() => void lookup(manualCode)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-pink-700 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              {busy ? 'Looking…' : 'Look up'}
            </button>
          </div>
          {result && (
            <p className={`text-xs mt-3 font-medium ${resultIsError ? 'text-rose-600' : 'text-emerald-700'}`}>{result}</p>
          )}
        </div>
      </main>
    </div>
  );
}
