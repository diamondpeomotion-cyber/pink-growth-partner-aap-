import React, { useState, useEffect } from 'react';

import {
  ArrowLeft,
  Bell,
  Calendar,
  DollarSign,
  Info,
  Store,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import BottomNav from './BottomNav';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchMyAttributions, fetchCommissionEntries, fetchMyPayouts } from '../../lib/gpRepository';

interface ShopEarning {
  id: string;
  name: string;
  code: string;
  earnings: number;
  transactions: number;
  status: 'Qualifying' | 'In Cycle' | 'Action Needed';
}

interface HistoricPayout {
  id: string;
  payoutId: string;
  date: string;
  amount: number;
  bank: string;
  status: 'Processed' | 'Initiated' | 'Failed';
  utr: string;
}



export default function QREarningsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  // Available state
  const [availableAmount, setAvailableAmount] = useState(8400);
  const [pendingAmount, setPendingAmount] = useState(3250);
  const [lifetimeAmount, setLifetimeAmount] = useState(72450);
  
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // App view controls
  const [activeFilter, setActiveFilter] = useState<'All' | 'Weekly' | 'Monthly'>('All');
  const [expandedSection, setExpandedSection] = useState<'shops' | 'payouts'>('shops');
  
  // Interactive Simulation variables
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  
  // Historic state
  const [payouts, setPayouts] = useState<HistoricPayout[]>([]);
  const [shops, setShops] = useState<ShopEarning[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const partner = await resolveGrowthPartner(supabase, user.id);
        if (!partner || cancelled) return;
        const [attribs, commissions, payoutRows] = await Promise.all([
          fetchMyAttributions(supabase, String(partner.id)),
          fetchCommissionEntries(supabase, String(partner.id)),
          fetchMyPayouts(supabase, String(partner.id)),
        ]);
        if (cancelled) return;
        setShops(attribs.map((a) => ({
          id: String(a.id),
          name: a.salon_name ?? 'Shop',
          code: a.salon_name ?? '',
          earnings: Math.round(commissions
            .filter((c) => c.salonId === a.salon_id)
            .reduce((sum, c) => sum + c.commissionPaise, 0) / 100),
          transactions: commissions.filter((c) => c.salonId === a.salon_id).length,
          status: (a.status === 'active' ? 'Qualifying' : 'Action Needed') as ShopEarning['status'],
        })));
        setPayouts(payoutRows.map((p) => ({
          id: p.id,
          payoutId: p.id.slice(0, 8).toUpperCase(),
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          amount: Math.round(p.amountPaise / 100),
          bank: 'Nexora payout',
          status: (p.status === 'paid' ? 'Processed' : p.status === 'failed' ? 'Failed' : 'Initiated') as HistoricPayout['status'],
          utr: p.id.slice(0, 12),
        })));
      } catch (err) {
        console.warn('QR earnings load failed:', err);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Read-only: no client-side money movement (Razorpay payout pipeline comes
  // in a later phase per PDR). Payouts only ever appear from the server ledger.
  const handleInitiatePayout = () => {
    triggerToast('Withdrawals are not available yet — payouts arrive via the secure payout pipeline in a later phase.');
    setShowPayoutModal(false);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100 overflow-x-hidden">
      
      {/* Dynamic Toast Alerts */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top">
          <Info size={16} className="text-pink-400 shrink-0" />
          <span className="font-semibold leading-normal">{toastMessage}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {/* Top Header */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs h-16">
        <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[var(--page-margin)] h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
            >
              <ArrowLeft size={20} className="stroke-[2.5px]" />
            </button>
            <h1 className="text-base font-black text-gray-900 tracking-tight">QR Earnings</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerToast('Custom calendar filters enabled for July 2026.')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all relative"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b90064] rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-6 pb-16 px-[var(--page-margin)] space-y-5">
        
        {/* Quality Audit Notice */}
        <section className="bg-pink-50/50 border border-pink-100/80 rounded-3xl p-4 flex gap-3 items-start shadow-2xs">
          <AlertCircle size={18} className="text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-gray-900 font-extrabold mb-0.5">Verified QR Transactions Only</p>
            <p className="text-[10.5px] text-gray-500 leading-normal font-medium">
              All commissions are generated exclusively through unique client Nexora QR scans. Personal payments or self-financing do not count towards payouts.
            </p>
          </div>
        </section>

        {/* Available Earnings Summary Panel */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50/40 rounded-full -mr-10 -mt-10 pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">Available Earnings</span>
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                ₹{availableAmount.toLocaleString()}
              </div>
            </div>

            {/* Metric Breakdown Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 border-t border-gray-100">
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Pending Verification</span>
                <span className="text-xs font-black text-gray-700">₹{pendingAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Current Week</span>
                <span className="text-xs font-black text-gray-700">₹6,800</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Current Month</span>
                <span className="text-xs font-black text-gray-700">₹12,450</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Lifetime Earnings</span>
                <span className="text-xs font-black text-gray-700">₹{lifetimeAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Schedule Widget banner */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <Clock size={14} className="text-gray-400" />
                <div>
                  <span className="text-[9px] text-gray-400 block font-bold uppercase">Next Automatic Settlement</span>
                  <span className="font-extrabold text-gray-800">04 Aug 2026 <span className="font-semibold text-gray-500">(Weekly Tuesday Cycle)</span></span>
                </div>
              </div>
            </div>

            {/* Primary Cashout Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => onNavigate('shop-earnings-ledger')}
                className="flex-1 h-11 bg-primary hover:bg-primary-container text-white rounded-2xl font-bold text-xs flex justify-center items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-98"
              >
                <Store size={14} /> Shop Earnings Ledger
              </button>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary border border-pink-100 h-11 rounded-2xl font-extrabold text-xs flex justify-center items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
              >
                <Wallet size={14} /> Withdraw Instantly
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Detail Sections (Expandable Accordion Tabs) */}
        <section className="space-y-3">
          <div className="flex gap-2 p-1 bg-gray-50 border border-gray-200/50 rounded-2xl shadow-inner">
            <button
              onClick={() => setExpandedSection('shops')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                expandedSection === 'shops'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Shop Earnings
            </button>
            <button
              onClick={() => setExpandedSection('payouts')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
                expandedSection === 'payouts'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Historic Settlements
            </button>
          </div>

          {/* Section A: Shop-wise Breakdown Details */}
          {expandedSection === 'shops' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 px-1 uppercase tracking-wider">
                <span>Onboarded Shop</span>
                <span>Calculated Earnings</span>
              </div>

              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white p-4 rounded-3xl border border-gray-200/50 shadow-xs flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigate('shop-earnings-ledger')}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-xs truncate max-w-[150px]">{shop.name}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                        shop.status === 'Qualifying'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-pink-50 text-primary border-pink-100'
                      }`}>
                        {shop.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">{shop.code} • {shop.transactions} qualifying scans</span>
                  </div>
                  <div className="text-right flex items-center gap-1.5 shrink-0">
                    <span className="font-black text-gray-900 text-xs">₹{shop.earnings.toLocaleString()}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section B: Historic Settlements Log */}
          {expandedSection === 'payouts' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 px-1 uppercase tracking-wider">
                <span>Date & Reference</span>
                <span>Transfer Amount</span>
              </div>

              {payouts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('payouts')}
                  className="bg-white p-4 rounded-3xl border border-gray-200/50 shadow-xs flex justify-between items-center hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                     <span className="font-bold text-gray-900 text-xs block">{p.payoutId}</span>
                     <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">{p.date} • {p.bank}</span>
                     <span className="text-[9px] text-emerald-600 font-mono font-bold uppercase tracking-wide block mt-1">UTR: {p.utr}</span>
                  </div>
                  <div className="text-right shrink-0">
                     <span className="font-black text-gray-900 text-xs block">₹{p.amount.toLocaleString()}</span>
                     <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100/50 font-extrabold px-1.5 py-0.5 rounded-full inline-block mt-1">
                       {p.status}
                     </span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => onNavigate('payouts')}
                className="w-full py-3.5 bg-white hover:bg-gray-50 text-primary font-extrabold border border-gray-200/50 rounded-2xl text-xs shadow-2xs transition-all active:scale-99 flex justify-center items-center gap-1.5"
              >
                <span>View Complete Payout History</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Bottom Nav bar component */}
      <BottomNav onNavigate={onNavigate} currentPage="earnings" />

    </div>
  );
}
