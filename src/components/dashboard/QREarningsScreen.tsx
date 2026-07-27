import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../../utils/db';

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
  TrendingUp,
  X,
  Sparkles,
  ChevronRight,
  Share2,
  AlertCircle
} from 'lucide-react';
import BottomNav from './BottomNav';

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

const SH_EARNINGS_DATA: ShopEarning[] = [
  { id: '1', name: 'Glow Beauty Parlour', code: 'NX-SHOP-0247', earnings: 4500, transactions: 47, status: 'In Cycle' },
  { id: '2', name: 'Urban Spa', code: 'NX-SHOP-0225', earnings: 15000, transactions: 112, status: 'Qualifying' },
  { id: '3', name: 'Royal Cut Salon', code: 'NX-SHOP-0248', earnings: 12000, transactions: 89, status: 'Action Needed' },
  { id: '4', name: 'Pink City Spa', code: 'NX-SHOP-0273', earnings: 0, transactions: 0, status: 'In Cycle' },
];

const HISTORIC_PAYOUTS: HistoricPayout[] = [
  { id: 'p1', payoutId: 'PAY-8912-NX', date: '21 Jul 2026', amount: 8400, bank: 'State Bank of India (***2345)', status: 'Processed', utr: 'SBI92384712039' },
  { id: 'p2', payoutId: 'PAY-8722-NX', date: '14 Jul 2026', amount: 12500, bank: 'State Bank of India (***2345)', status: 'Processed', utr: 'SBI92112341202' },
  { id: 'p3', payoutId: 'PAY-8540-NX', date: '07 Jul 2026', amount: 10600, bank: 'State Bank of India (***2345)', status: 'Processed', utr: 'SBI91049581290' },
];

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

    const loadData = async () => {
      try {
        const cachedEarnings = await getItem<any>('earnings_data');
        if (cachedEarnings) {
          setAvailableAmount(cachedEarnings.availableAmount);
          setPendingAmount(cachedEarnings.pendingAmount);
          setLifetimeAmount(cachedEarnings.lifetimeAmount);
        } else {
          await setItem('earnings_data', { availableAmount: 8400, pendingAmount: 3250, lifetimeAmount: 72450 });
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
      }
    };
    loadData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setItem('earnings_data', { availableAmount, pendingAmount, lifetimeAmount }).catch(console.error);
  }, [availableAmount, pendingAmount, lifetimeAmount]);
  
  // App view controls
  const [activeFilter, setActiveFilter] = useState<'All' | 'Weekly' | 'Monthly'>('All');
  const [expandedSection, setExpandedSection] = useState<'shops' | 'payouts'>('shops');
  
  // Interactive Simulation variables
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [withdrawAmountSim, setWithdrawAmountSim] = useState('8400');
  
  // Historic state
  const [payouts, setPayouts] = useState<HistoricPayout[]>(HISTORIC_PAYOUTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Process a simulated withdrawal
  const handleInitiatePayout = () => {
    const amt = parseFloat(withdrawAmountSim);
    if (isNaN(amt) || amt <= 0 || amt > availableAmount) {
      triggerToast('❌ Please enter a valid amount within your available balance.');
      return;
    }

    setPayoutLoading(true);
    setShowPayoutModal(false);

    // Simulate Server-Side payout validation & execution delay
    setTimeout(() => {
      setPayoutLoading(false);
      setPayoutSuccess(true);
      setAvailableAmount(prev => prev - amt);
      setLifetimeAmount(prev => prev + amt);
      
      // Add to historic log
      const newPayout: HistoricPayout = {
        id: Math.random().toString(),
        payoutId: `PAY-${Math.floor(1000 + Math.random() * 9000)}-NX`,
        date: 'Today',
        amount: amt,
        bank: 'State Bank of India (***2345)',
        status: 'Processed',
        utr: `TXN${Math.floor(100000000000 + Math.random() * 900000000000)}`
      };
      setPayouts([newPayout, ...payouts]);
    }, 2200);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans max-w-md mx-auto shadow-lg border-x border-gray-100">
      
      {/* Dynamic Toast Alerts */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top">
          <Info size={16} className="text-pink-400 shrink-0" />
          <span className="font-semibold leading-normal">{toastMessage}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {payoutLoading && (
        <div className="fixed inset-0 z-110 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-3xl"></div>
            <div className="absolute inset-0 border-4 border-t-primary rounded-3xl animate-spin"></div>
            <DollarSign size={28} className="text-primary animate-pulse" />
          </div>
          <h3 className="text-white font-extrabold text-sm">Processing Instant Bank Settlement</h3>
          <p className="text-gray-300 text-[11px] mt-1 max-w-xs">
            Routing UPI payment to State Bank of India (***2345). Please don't close the application.
          </p>
        </div>
      )}

      {/* Payout Success Screen */}
      {payoutSuccess && (
        <div className="fixed inset-0 z-110 bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-inner">
            <CheckCircle2 size={36} className="stroke-[2.5px]" />
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Settlement Successful
          </span>
          <h3 className="text-gray-900 font-black text-lg mt-3">Commission Disbursed!</h3>
          <p className="text-gray-500 text-xs mt-1 max-w-xs leading-relaxed">
            ₹{withdrawAmountSim} has been successfully settled instantly under the UPI instant routing network to State Bank of India (***2345).
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 w-full max-w-xs my-6 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Transaction UTR</span>
              <span className="font-black text-gray-900 font-mono">UTRN92834710129</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Settled Amount</span>
              <span className="font-black text-primary">₹{withdrawAmountSim}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Destination bank</span>
              <span className="font-bold text-gray-700">SBI (***2345)</span>
            </div>
          </div>

          <button
            onClick={() => setPayoutSuccess(false)}
            className="w-full max-w-xs bg-primary text-white h-12 rounded-2xl font-bold text-xs active:scale-98 transition-all cursor-pointer"
          >
            Back to Earnings
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 bg-white/80 backdrop-blur-md shadow-xs h-16 flex justify-between items-center px-4 max-w-md mx-auto border-b border-gray-100">
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
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-16 px-4 space-y-5">
        
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

              {SH_EARNINGS_DATA.map((shop) => (
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

      {/* Instant Settlement Withdrawal Dialog Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowPayoutModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                <Sparkles size={16} />
                <span>Instant settlement</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="text-center pb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">₹{availableAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Withdraw Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={withdrawAmountSim}
                    onChange={(e) => setWithdrawAmountSim(e.target.value)}
                    max={availableAmount}
                    className="w-full h-11 pl-7 pr-3 bg-gray-50 border-none rounded-2xl font-bold text-xs focus:ring-1 focus:ring-primary/20 text-gray-950"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex justify-between pt-1">
                  <button
                    onClick={() => setWithdrawAmountSim((availableAmount / 2).toString())}
                    className="text-[10px] font-bold text-gray-400 hover:text-primary"
                  >
                    50% (₹{availableAmount / 2})
                  </button>
                  <button
                    onClick={() => setWithdrawAmountSim(availableAmount.toString())}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[11px] text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">Direct Bank Destination</p>
                <p>Bank Name: <strong>State Bank of India</strong></p>
                <p>Account ID: <strong>*****2345 (Primary Onboarded Bank)</strong></p>
              </div>

              <button
                onClick={handleInitiatePayout}
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <CheckCircle2 size={14} /> Disburse to Bank Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav bar component */}
      <BottomNav onNavigate={onNavigate} currentPage="earnings" />

    </div>
  );
}
