import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchCommissionEntries } from '../../lib/gpRepository';
import {
  ArrowLeft,
  Search,
  QrCode,
  AlertCircle,
  Info,
  Calendar,
  X,
  Sparkles,
  Award,
  RefreshCw,
  Star,
  Check
} from 'lucide-react';
import BottomNav from './BottomNav';

interface LedgerItem {
  id: string;
  shopName: string;
  shopCode: string;
  status: 'Available' | 'Pending' | 'Paid' | 'Reversed';
  type: 'standard' | 'Activation Earning' | 'Recurring Growth Share';
  amount: number;
  date: string;
  cycle?: string;
  payoutId?: string;
  reversalReason?: string;
  banner?: string;
  calculation?: {
    qrRevenue: number;
    platformFee: number;
    partnerShare: number;
  };
}

// Initial structured data exactly matching the user's template layout and card values


export default function ShopEarningsLedgerScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);

  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'Available' | 'Paid' | 'Reversed'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic bottom sheet calculation modal
  const [calculationTx, setCalculationTx] = useState<LedgerItem | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const partner = await resolveGrowthPartner(supabase, user.id);
        if (!partner || cancelled) { setLedgerItems([]); return; }
        const rows = await fetchCommissionEntries(supabase, String(partner.id));
        if (cancelled) return;
        setLedgerItems(rows.map((c) => ({
          id: c.id,
          shopName: 'Shop',
          shopCode: '',
          status: (c.status === 'held' ? 'Pending' : c.status === 'payable' ? 'Available' : c.status === 'paid' ? 'Paid' : 'Reversed') as LedgerItem['status'],
          type: 'standard',
          amount: Math.round(c.commissionPaise / 100),
          date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          cycle: c.holdUntil ? 'Hold till ' + new Date(c.holdUntil).toLocaleDateString('en-GB') : undefined,
          payoutId: c.bookingId ?? undefined,
        })));
      } catch (err) {
        console.warn('Ledger load failed:', err);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live stats from the actual commission ledger (no hardcoded base).
  const stats = useMemo(() => {
    return {
      available: ledgerItems.filter(i => i.status === 'Available').reduce((sum, i) => sum + i.amount, 0),
      pending: ledgerItems.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0),
      paid: ledgerItems.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0),
      reversed: ledgerItems.filter(i => i.status === 'Reversed').reduce((sum, i) => sum + Math.abs(i.amount), 0)
    };
  }, [ledgerItems]);

  // Compute dynamic filter counts for display in pills
  const counts = useMemo(() => {
    return {
      all: ledgerItems.length,
      pending: ledgerItems.filter(i => i.status === 'Pending').length,
      available: ledgerItems.filter(i => i.status === 'Available').length,
      paid: ledgerItems.filter(i => i.status === 'Paid').length,
      reversed: ledgerItems.filter(i => i.status === 'Reversed').length
    };
  }, [ledgerItems]);

  // Filter items based on active search text and the active filter pill selection
  const filteredItems = useMemo(() => {
    return ledgerItems.filter(item => {
      const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
      const matchesSearch = item.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.shopCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.banner && item.banner.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [ledgerItems, selectedFilter, searchQuery]);

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top">
          <Sparkles size={16} className="text-pink-400 shrink-0" />
          <span className="font-semibold leading-normal">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-xs h-16">
        <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[var(--page-margin)] h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onBack) onBack();
                else onNavigate('earnings');
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
            >
              <ArrowLeft size={20} className="stroke-[2.5px]" />
            </button>
            <div>
              <h1 className="text-base font-black text-gray-900 tracking-tight">Shop Earnings</h1>
              <span className="text-[10px] text-gray-400 font-bold uppercase block -mt-0.5">Ledger Database</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-6 pb-16 px-[var(--page-margin)] space-y-5">

        {/* Mandatory Notice */}
        <section className="bg-pink-50/50 border border-pink-100/80 rounded-3xl p-4 flex gap-3 items-start shadow-2xs">
          <Info size={18} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-gray-900 font-extrabold mb-0.5">Important Notice</p>
            <p className="text-[10.5px] text-gray-500 leading-normal font-medium">
              Only successful and verified Nexora QR payments are included in these earnings calculations.
            </p>
          </div>
        </section>

        {/* Period Selector */}
        <section className="flex justify-between items-center">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">This Month</h2>
          <button 
            onClick={() => triggerToast('📅 Period selection filtered for July 2026')}
            className="text-primary font-bold text-xs flex items-center gap-1 hover:underline"
          >
            Change Date <Calendar size={13} />
          </button>
        </section>

        {/* Earnings Summary Bento Box Grid */}
        <section className="grid grid-cols-2 gap-3">
          
          {/* Available */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/60 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Available</span>
            <div className="text-lg font-black text-emerald-600">₹{stats.available.toLocaleString()}</div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/60 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pending</span>
            <div className="text-lg font-black text-amber-500">₹{stats.pending.toLocaleString()}</div>
          </div>

          {/* Paid */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/60 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#356df4]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Paid</span>
            <div className="text-lg font-black text-blue-600">₹{stats.paid.toLocaleString()}</div>
          </div>

          {/* Reversed */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/60 shadow-2xs relative overflow-hidden flex flex-col justify-between">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reversed</span>
            <div className="text-lg font-black text-red-500">₹{stats.reversed.toLocaleString()}</div>
          </div>

        </section>

        {/* Interactive Search Bar */}
        <section className="relative">
          <input
            type="text"
            placeholder="Search shop name or Shop ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-950 shadow-2xs"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </section>

        {/* Filters Scrollable Pills */}
        <section className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedFilter('All')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'All'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedFilter === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.all}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('Pending')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'Pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Pending <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedFilter === 'Pending' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.pending}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('Available')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'Available'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Available <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedFilter === 'Available' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.available}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('Paid')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'Paid'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Paid <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedFilter === 'Paid' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.paid}</span>
          </button>

          <button
            onClick={() => setSelectedFilter('Reversed')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedFilter === 'Reversed'
                ? 'bg-red-500 text-white border-red-500 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Reversed <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedFilter === 'Reversed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{counts.reversed}</span>
          </button>
        </section>

        {/* Dynamic Transaction List */}
        <section className="space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Ledger Items ({filteredItems.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">Verification ledger file</span>
          </div>

          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-2">
                <QrCode size={36} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No matching ledger items found</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('All');
                  }}
                  className="text-primary font-bold text-[11px] underline"
                >
                  Clear searches
                </button>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAvailable = item.status === 'Available';
                const isPending = item.status === 'Pending';
                const isPaid = item.status === 'Paid';
                const isReversed = item.status === 'Reversed';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-2xs hover:shadow-xs transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Status vertical color bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isAvailable ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isPaid ? 'bg-blue-600' : 'bg-red-500'
                    }`}></div>

                    <div className="flex justify-between items-start mb-3 pl-1">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          {item.shopName}
                          {item.type === 'Activation Earning' && (
                            <span className="text-amber-500"><Star size={11} className="fill-amber-500" /></span>
                          )}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold">{item.shopCode}</p>
                        
                        {item.type === 'Activation Earning' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-1">
                            <Award size={11} /> Activation Earning
                          </span>
                        )}
                        {item.type === 'Recurring Growth Share' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1">
                            <RefreshCw size={11} className="animate-spin-slow" /> Recurring Growth Share
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <p className={`text-sm font-black ${isReversed ? 'text-red-500' : isAvailable ? 'text-emerald-600' : 'text-gray-950'}`}>
                          {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toLocaleString()}
                        </p>
                        
                        {/* Status label pill */}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold mt-1.5 ${
                          isAvailable 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : isPending 
                              ? 'bg-amber-50 text-amber-700' 
                              : isPaid 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'bg-red-50 text-red-700'
                        }`}>
                          {item.status === 'Pending' ? 'Pending Verif.' : item.status}
                        </span>
                      </div>
                    </div>

                    {/* Banner helper text */}
                    {item.banner && (
                      <div className="bg-gray-50/80 p-2 rounded-xl mb-3 border border-gray-100 flex items-center gap-1.5 pl-1.5">
                        <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
                        <span className="text-[9.5px] text-gray-500 font-semibold">{item.banner}</span>
                      </div>
                    )}

                    {/* Reversal specific block */}
                    {isReversed && item.reversalReason && (
                      <div className="bg-red-50/50 p-2.5 rounded-xl mb-3 border border-red-100/50 flex gap-2">
                        <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                        <span className="text-[9.5px] text-red-700 font-semibold">Reason: {item.reversalReason}</span>
                      </div>
                    )}

                    {/* Bottom row actions */}
                    <div className="flex justify-between items-end border-t border-gray-50 pt-3 pl-1">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[9.5px] text-gray-400 font-semibold flex items-center gap-1">
                          <Calendar size={11} /> {item.date}
                        </p>
                        {item.cycle && (
                          <p className="text-[9.5px] text-gray-400 font-semibold flex items-center gap-1">
                            <RefreshCw size={11} /> Cycle: {item.cycle}
                          </p>
                        )}
                        {item.payoutId && (
                          <p className="text-[9.5px] text-gray-400 font-semibold flex items-center gap-1">
                            <Info size={11} /> ID: {item.payoutId}
                          </p>
                        )}
                      </div>

                      {/* Detail triggers */}
                      {item.calculation ? (
                        <button
                          onClick={() => setCalculationTx(item)}
                          className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-primary rounded-xl font-bold text-[10px] transition-all cursor-pointer active:scale-95"
                        >
                          View Calculation
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (isPaid) {
                              onNavigate('payout-history');
                            } else {
                              triggerToast(`Voucher info: ${item.shopName} transaction filed.`);
                            }
                          }}
                          className="px-3.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-[10px] transition-all cursor-pointer active:scale-95"
                        >
                          {isPaid ? 'View Payout' : isReversed ? 'View Reversal' : 'View Details'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

      {/* Calculation Bottom Sheet */}
      {calculationTx && calculationTx.calculation && (
        <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCalculationTx(null)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-t-[24px] sm:rounded-3xl overflow-hidden shadow-2xl z-10 animate-in slide-in-from-bottom sm:zoom-in-95">
            {/* Grab Drag handle for touch */}
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto my-3 sm:hidden"></div>

            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-gray-900">Earning Calculation</h3>
                <p className="text-[10px] text-gray-400 font-bold block mt-0.5">
                  {calculationTx.shopName} • {calculationTx.date}
                </p>
              </div>
              <button
                onClick={() => setCalculationTx(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper body */}
            <div className="p-5 space-y-5 text-xs">
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-8 before:w-0.5 before:bg-gray-100">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-6 w-4 h-4 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-gray-900 text-[11px]">Total QR Revenue</p>
                      <p className="text-[10px] text-gray-400 font-medium">Shop's daily collection via Nexora QR</p>
                    </div>
                    <span className="font-extrabold text-gray-900">₹{calculationTx.calculation.qrRevenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-6 w-4 h-4 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-gray-900 text-[11px]">Nexora Commission</p>
                      <p className="text-[10px] text-gray-400 font-medium">10% Platform Fee</p>
                    </div>
                    <span className="font-extrabold text-gray-900">₹{calculationTx.calculation.platformFee.toLocaleString()}</span>
                  </div>
                </div>

                {/* Step 3 (Final Earning highlighting flat 1% GP Share of Platform Fee) */}
                <div className="relative bg-pink-50/50 p-4 rounded-2xl -ml-6 border border-pink-100">
                  <div className="absolute -left-2 top-5 w-4.5 h-4.5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-xs">
                    <Check size={11} className="stroke-[3.5px]" />
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <div>
                      <p className="text-xs font-black text-primary">Your Earning</p>
                      <p className="text-[10px] text-pink-700/80 font-bold">10% GP Share of Platform Fee</p>
                    </div>
                    <span className="text-base font-black text-primary">₹{calculationTx.calculation.partnerShare.toFixed(2)}</span>
                  </div>
                </div>

              </div>

              <button
                onClick={() => setCalculationTx(null)}
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all mt-4"
              >
                Close Breakdown
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav onNavigate={onNavigate} currentPage="earnings" />

    </div>
  );
}
