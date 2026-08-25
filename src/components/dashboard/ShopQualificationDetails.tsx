import React from 'react';
import { ArrowLeft, Info } from 'lucide-react';

export default function ShopQualificationDetails({
  onBack,
  onNavigate
}: {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}) {
  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col pb-20 font-sans w-full">
      <header className="sticky top-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-screen-xl mx-auto w-full flex items-center gap-2 px-[var(--page-margin)] h-16">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">Shop Qualification</h1>
            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Live ledger only</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-6 px-[var(--page-margin)] space-y-4">
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/60 flex gap-3">
          <Info size={18} className="text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              Daily QR volume, 15-day streaks, and merchant phone numbers are not stored in this Growth Partner app.
            </p>
            <p>
              Qualification progress must come from verified Nexora QR payments on the shared ledger. This screen no longer invents Glow Beauty Parlour transactions or UTRs.
            </p>
            <button
              onClick={() => onNavigate?.('shops')}
              className="mt-2 text-primary font-bold text-xs hover:underline"
            >
              Back to attributed shops
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
