import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  HelpCircle,
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  Plus,
  Lock,
  DollarSign,
  AlertCircle,
  Award,
  Check
} from 'lucide-react';
import BottomNav from './BottomNav';

interface PayoutStatusItem {
  id: string;
  type: string;
  date: string;
  amount: number;
  status: 'Upcoming' | 'Completed' | 'Failed' | 'Carried Forward';
  description?: string;
}

const INITIAL_HISTORY: PayoutStatusItem[] = [
  { id: 'h-1', type: 'Payout Scheduled', date: '03 Aug 2026', amount: 8400, status: 'Upcoming', description: 'Weekly Tuesday Auto-Reprocessing' },
  { id: 'h-2', type: 'Instant settlement', date: '26 Jul 2026', amount: 7850, status: 'Completed', description: 'Settled to HDFC Bank' },
  { id: 'h-3', type: 'Instant settlement', date: '19 Jul 2026', amount: 6400, status: 'Completed', description: 'Settled to HDFC Bank' },
  { id: 'h-4', type: 'Bank Settlement Fail', date: '12 Jul 2026', amount: 7200, status: 'Failed', description: 'IFSC matching failure' },
  { id: 'h-5', type: 'Rolling adjustment', date: '05 Jul 2026', amount: 300, status: 'Carried Forward', description: 'Pending client signature' }
];

export default function PayoutsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Failed' | 'Carried Forward'>('Upcoming');
  const [showManageBankModal, setShowManageBankModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bank state simulation
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountHolder, setAccountHolder] = useState('Rajesh Kumar');
  const [accountNumber, setAccountNumber] = useState('•••• 4582');
  const [isVerified, setIsVerified] = useState(true);

  // Help modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // New simulated history
  const [historyItems, setHistoryItems] = useState<PayoutStatusItem[]>(INITIAL_HISTORY);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredHistory = useMemo(() => {
    return historyItems.filter(item => item.status === activeTab);
  }, [historyItems, activeTab]);

  const handleUpdateBank = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('🏦 Bank credentials updated! Standard IMPS test initiated.');
    setShowManageBankModal(false);
    setIsVerified(true);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans max-w-md mx-auto shadow-lg border-x border-gray-100">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top">
          <Sparkles size={16} className="text-pink-400 shrink-0" />
          <span className="font-semibold leading-normal">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 bg-white/80 backdrop-blur-md shadow-xs h-16 flex justify-between items-center px-4 max-w-md mx-auto border-b border-gray-100">
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
            <h1 className="text-base font-black text-gray-900 tracking-tight">Payouts</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase block -mt-0.5">Clearing Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelpModal(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
          >
            <HelpCircle size={18} />
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
        
        {/* Main Payout Bento Card */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200/60 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-pink-100/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center mb-6 pt-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Next Scheduled Payout</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">₹8,400</h2>
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
              <CheckCircle2 size={11} className="stroke-[3px]" /> Verified
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs border-t border-gray-100 pt-4 mb-4">
            <div>
              <span className="text-gray-400 font-bold block mb-0.5">Payout Date</span>
              <span className="font-extrabold text-gray-800">04 Aug 2026</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block mb-0.5">Current Cycle</span>
              <span className="font-extrabold text-gray-800">27 Jul – 02 Aug</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block mb-0.5">Available Earnings</span>
              <span className="font-extrabold text-emerald-600">₹8,400</span>
            </div>
            <div>
              <span className="text-gray-400 font-bold block mb-0.5">Pending Audit</span>
              <span className="font-extrabold text-amber-500">₹3,250</span>
            </div>

            <div className="col-span-2 pt-1">
              <span className="text-gray-400 font-bold block mb-1">Method</span>
              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                <Building size={14} className="text-gray-400 shrink-0" />
                <span className="font-bold text-gray-700 truncate text-[11px]">
                  Bank Account ({bankName} • {accountNumber})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('shop-earnings-ledger')}
            className="w-full bg-pink-50 hover:bg-pink-100 text-primary font-black py-3.5 rounded-2xl text-xs transition-colors cursor-pointer text-center"
          >
            View Included Earnings Breakdown
          </button>
        </section>

        {/* Current Cycle Accounting Sheet Panel */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/60">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <RefreshCw size={13} className="text-primary" /> Current Cycle Breakdown
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold">Opening Balance</span>
              <span className="font-extrabold text-gray-700">₹5,600</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold flex items-center gap-1">
                New Verified QR Scans <CheckCircle2 size={11} className="text-emerald-500 stroke-[3px]" />
              </span>
              <span className="font-extrabold text-emerald-600">+₹3,100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold">Disbursement Adjustments</span>
              <span className="font-extrabold text-red-500">-₹300</span>
            </div>
            <div className="pt-3.5 mt-3.5 border-t border-gray-100 flex justify-between items-center">
              <span className="font-black text-gray-900">Estimated Tuesday Payout</span>
              <span className="font-black text-base text-[#b90064]">₹8,400</span>
            </div>
          </div>
        </section>

        {/* Payout Progress Timeline Tracker */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/60">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-5">Payout Progress</h3>
          <div className="relative pl-6 space-y-6">
            
            {/* Timeline Line indicator */}
            <div className="absolute left-[10px] top-2.5 bottom-6 w-[2px] bg-gray-100 rounded-full"></div>

            {/* Step 1: Completed */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white z-10 shadow-xs">
                <Check size={11} className="text-white stroke-[4px]" />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-xs">Earnings Collection</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Completed for current weekly cycle scans.</p>
              </div>
            </div>

            {/* Step 2: In progress */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-4 border-white z-10 shadow-xs">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
              </div>
              <div>
                <p className="font-extrabold text-primary text-xs">Verification & Reversal Check</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">In Progress. Validating merchant bank clearance.</p>
              </div>
            </div>

            {/* Step 3: Scheduled */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-gray-100 border-4 border-white z-10 shadow-xs"></div>
              <div>
                <p className="font-extrabold text-gray-400 text-xs">Payout Processing</p>
                <p className="text-[10px] text-gray-300 mt-0.5 font-medium">Scheduled for end of current cycle.</p>
              </div>
            </div>

            {/* Step 4: Bank Transfer Pending */}
            <div className="relative">
              <div className="absolute -left-[29px] top-0.5 w-5 h-5 rounded-full bg-gray-100 border-4 border-white z-10 shadow-xs"></div>
              <div>
                <p className="font-extrabold text-gray-400 text-xs">Direct Bank Settlement</p>
                <p className="text-[10px] text-gray-300 mt-0.5 font-medium">Pending final IMPS routing trigger.</p>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-400 font-bold flex justify-center items-center gap-1 uppercase">
              <Clock size={12} /> Next system update: 03 Aug 2026
            </p>
          </div>
        </section>

        {/* Pending / Not Included Yet list */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/60">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Not Included Yet</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Pending daily verification</p>
            </div>
            <span className="font-black text-base text-amber-500">₹3,250</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="bg-gray-50 rounded-2xl p-3 flex justify-between items-center border border-gray-100 text-xs">
              <span className="font-bold text-gray-500">UPI Settlement Hold</span>
              <span className="font-extrabold text-gray-800">₹1,850</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex justify-between items-center border border-gray-100 text-xs">
              <span className="font-bold text-gray-500">Customer Refund Checks</span>
              <span className="font-extrabold text-gray-800">₹900</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-3 flex justify-between items-center border border-gray-100 text-xs">
              <span className="font-bold text-gray-500">New Shop qualification lock</span>
              <span className="font-extrabold text-gray-800">₹500</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('shop-earnings-ledger')}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold h-11 rounded-2xl text-xs transition-all active:scale-98"
          >
            View Pending Scans
          </button>
        </section>

        {/* Bank Account Details Management */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/60 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-3xl"></div>
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4">Payout Bank Account</h3>
          
          <div className="flex items-center gap-3 mb-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-11 h-11 bg-white rounded-full shadow-2xs flex items-center justify-center text-primary border border-gray-100 shrink-0">
              <Building size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs text-gray-900 truncate">{bankName}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{accountHolder} • {accountNumber}</p>
            </div>
            {isVerified && (
              <div className="text-emerald-500 shrink-0" title="Verified Account">
                <CheckCircle2 size={18} className="fill-emerald-50 text-emerald-600 stroke-[2.5px]" />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowManageBankModal(true)}
            className="w-full bg-white border border-gray-200 text-primary font-bold h-11 rounded-2xl text-xs hover:bg-pink-50 hover:border-pink-200 transition-all cursor-pointer active:scale-98"
          >
            Manage Account details
          </button>
        </section>

        {/* Dynamic History Tabs & Filtered Lists */}
        <section className="space-y-3.5">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider pl-1">Settlement History</h3>
          
          {/* Tabs header row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {(['Upcoming', 'Completed', 'Failed', 'Carried Forward'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content List */}
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 text-center border border-gray-100 text-xs font-semibold text-gray-400">
                No settlements logged under {activeTab}
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200/50 shadow-2xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : item.status === 'Failed'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs">{item.type}</p>
                      <p className="text-[10px] text-gray-400 font-bold block mt-0.5">{item.date} • {item.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900 text-xs">₹{item.amount.toLocaleString()}</p>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Cycle Total</span>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => onNavigate('payout-history')}
              className="w-full mt-2 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-primary font-bold rounded-2xl text-xs shadow-3xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <span>Verify & Download PDF Vouchers</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>

      </main>

      {/* Modal A: Manage Bank Account details */}
      {showManageBankModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowManageBankModal(false)}
          ></div>

          <form
            onSubmit={handleUpdateBank}
            className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="text-primary font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={15} /> Update Settlement Bank
              </span>
              <button
                type="button"
                onClick={() => setShowManageBankModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account ID / Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-[10.5px] text-amber-800 leading-normal font-medium">
                🔒 Verification process deposits ₹1.00 via IMPS immediately to confirm account activation.
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                Save & Verify Bank Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal B: Help Modal details */}
      {showHelpModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowHelpModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-primary font-black text-xs uppercase tracking-wider">How Payouts Work</span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:bg-gray-50 p-1 rounded-full"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed text-gray-600">
              <p>
                <strong>1. Scans Verification</strong>: Commissions are tracked in real-time as customer payments are cleared via Nexora QR codes at onboarded merchant partner shops.
              </p>
              <p>
                <strong>2. Cycle Timeline</strong>: Standard payout run occurs weekly on Tuesdays. Transactions processed Monday through Sunday are verified and routed.
              </p>
              <p>
                <strong>3. Automated Settlement</strong>: Verified available funds are sent instantly to your connected verified bank account under secure UPI frameworks.
              </p>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95"
            >
              Acknowledge Guidelines
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav onNavigate={onNavigate} currentPage="earnings" />

    </div>
  );
}
