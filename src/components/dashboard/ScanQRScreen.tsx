import React, { useState } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchMyAttributions } from '../../lib/gpRepository';

export default function ScanQRScreen({ onBack }: { onBack: () => void }) {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (code: string) => {
    const needle = code.trim();
    if (!needle) return;
    if (!supabase) {
      setResult('Supabase is not configured.');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResult('Sign in required.');
        return;
      }
      const partner = await resolveGrowthPartner(supabase, user.id);
      if (!partner) {
        setResult('No Growth Partner profile is linked to this account.');
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
        setResult(`Matched attributed shop: ${match.salon_name || match.salon_id} (${match.status}).`);
      } else {
        setResult('No attributed shop matches that code. Camera scanning is not wired to a decoder in this build.');
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setBusy(false);
    }
  };

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
          <h1 className="text-lg font-bold text-primary">Look up shop</h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-[var(--page-margin)] pt-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Camera size={36} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Camera QR decoding is not enabled in this build. Look up a shop by salon id, attribution id, or exact shop name from your attributed list.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2 text-sm">Shop code or name</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="salon id or shop name"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              disabled={busy}
              onClick={() => void lookup(manualCode)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {busy ? 'Looking…' : 'Look up'}
            </button>
          </div>
          {result && <p className="text-xs text-gray-700 mt-3 font-medium">{result}</p>}
        </div>
      </main>
    </div>
  );
}
