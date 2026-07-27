import React from 'react';
import { QrCode, CheckCircle, Clock, CalendarDays, TrendingUp, ArrowRight, Info } from 'lucide-react';

export default function EarningsCard({ currentShops = 247, totalShops = 250, onNavigate }: { currentShops?: number, totalShops?: number, onNavigate?: (page: string) => void }) {
  const progress = Math.min((currentShops / totalShops) * 100, 100);
  return (
    <div className="bg-white rounded-[18px] border border-[#e4e2e1] shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2e7d32] opacity-80"></div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1 relative">
          <div className="flex justify-between items-start w-full">
            <h2 className="text-[13px] font-medium text-[#5a3f47] uppercase tracking-wider">Available Earnings</h2>
            <div className="bg-[#fde7f3] text-[#b90064] p-2 rounded-full flex items-center justify-center shadow-sm">
              <QrCode size={20} />
            </div>
          </div>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-[28px] font-extrabold text-[#1b1c1b] tracking-tight">₹8,400</p>
            <div className="flex items-center gap-1 mb-1.5 px-2 py-0.5 bg-[#2e7d32]/10 rounded-full">
              <CheckCircle className="text-[#2e7d32]" size={14} />
              <span className="text-[11px] font-semibold text-[#2e7d32]">Verified</span>
            </div>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-[#1b1c1b]">Qualifying Shops</span>
                <span className="text-sm font-bold text-[#1b1c1b]">{currentShops} / {totalShops}</span>
            </div>
            <div className="h-3 w-full bg-[#f6f3f2] rounded-full overflow-hidden">
                <div className="h-full bg-[#e6007e] rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        <hr className="border-[#e4e2e1]/50"/>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f6f3f2] rounded-lg p-3 flex flex-col gap-1 border border-[#e4e2e1]/30">
            <span className="text-[11px] text-[#5a3f47] flex items-center gap-1">
              <Clock className="text-[#ed6c02]" size={14} />
              Pending
            </span>
            <span className="text-[18px] font-semibold text-[#1b1c1b]">₹3,250</span>
          </div>
          <div className="bg-[#f6f3f2] rounded-lg p-3 flex flex-col gap-1 border border-[#e4e2e1]/30">
            <span className="text-[11px] text-[#5a3f47] flex items-center gap-1">
              <CalendarDays className="text-[#0052da]" size={14} />
              This Week
            </span>
            <span className="text-[18px] font-semibold text-[#1b1c1b]">₹6,800</span>
          </div>
          <div className="col-span-2 bg-gradient-to-r from-[#fde7f3]/30 to-[#f6f3f2] rounded-lg p-3 flex flex-row items-center justify-between border border-[#e4e2e1]/30">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#5a3f47]">Lifetime Earnings</span>
              <span className="text-xl font-semibold text-[#1b1c1b]">₹72,450</span>
            </div>
            <TrendingUp className="text-[#e6007e]/50" size={32} />
          </div>
          <div className="col-span-2 flex justify-between items-center px-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#5a3f47]">Next Payout</span>
              <span className="text-sm text-[#1b1c1b] font-medium">04 Aug 2026</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] text-[#5a3f47]">Cycle</span>
              <span className="text-sm text-[#1b1c1b] font-medium">7 Days</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onNavigate?.('earnings')}
          className="w-full h-14 bg-[#e6007e] text-white font-medium text-sm rounded-[16px] flex items-center justify-center gap-2 hover:bg-[#b80663] transition-colors active:scale-[0.98] shadow-md shadow-[#e6007e]/20"
        >
          View Earnings
          <ArrowRight size={18} />
        </button>
        <div className="flex flex-col gap-2 mt-2 p-3 bg-[#f0edec] rounded-xl border border-[#e4e2e1]/50">
          <p className="text-[11px] text-[#5a3f47] flex items-start gap-2">
            <Info className="text-[#b90064] mt-0.5" size={14} />
            <span>All earnings are calculated only from successful and verified Nexora QR payments.</span>
          </p>
          <p className="text-[10px] leading-[14px] font-medium tracking-wide text-[#8e6f77] italic px-5">
            * Cash, personal QR and payments outside Nexora are not included.
          </p>
        </div>
      </div>
    </div>
  );
}
