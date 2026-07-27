import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info,
  Building,
  RefreshCw,
  Plus,
  FileText,
  AlertTriangle,
  X,
  Smartphone,
  Check
} from 'lucide-react';
import BottomNav from './BottomNav';

interface PayoutItem {
  id: string;
  payoutId: string;
  date: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  status: 'Completed' | 'Processing' | 'Failed';
  utr: string;
  failureReason?: string;
}

const INITIAL_PAYOUTS: PayoutItem[] = [
  {
    id: 'pay-001',
    payoutId: 'PAY-8912-NX',
    date: '26 Jul 2026',
    amount: 7850,
    bankName: 'State Bank of India',
    bankAccount: '...8940',
    status: 'Completed',
    utr: 'SBI92384712039'
  },
  {
    id: 'pay-002',
    payoutId: 'PAY-8722-NX',
    date: '19 Jul 2026',
    amount: 6400,
    bankName: 'State Bank of India',
    bankAccount: '...8940',
    status: 'Processing',
    utr: 'SBIPENDING92301'
  },
  {
    id: 'pay-003',
    payoutId: 'PAY-8540-NX',
    date: '12 Jul 2026',
    amount: 7200,
    bankName: 'State Bank of India',
    bankAccount: '...8940',
    status: 'Failed',
    utr: 'N/A',
    failureReason: 'Incorrect IFSC code or invalid bank account structure'
  },
  {
    id: 'pay-004',
    payoutId: 'PAY-8102-NX',
    date: '05 Jul 2026',
    amount: 6900,
    bankName: 'State Bank of India',
    bankAccount: '...8940',
    status: 'Completed',
    utr: 'SBI91049581290'
  }
];

export default function PayoutHistoryScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  const [payouts, setPayouts] = useState<PayoutItem[]>(INITIAL_PAYOUTS);
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  
  // Interactive simulator for resolving the failed payout
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [newIFSC, setNewIFSC] = useState('SBIN0001234');
  const [newAccount, setNewAccount] = useState('348291048940');
  const [isResolving, setIsResolving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simulate resolving a failed payout
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIFSC || !newAccount) {
      triggerToast('❌ Please fill in all fields.');
      return;
    }
    
    setIsResolving(true);
    setTimeout(() => {
      setIsResolving(false);
      setShowResolveModal(false);
      
      // Update status of failed payout PAY-8540-NX (pay-003) to Processing
      setPayouts(prev => prev.map(p => {
        if (p.id === 'pay-003') {
          return {
            ...p,
            status: 'Processing',
            failureReason: undefined,
            utr: `SBIPROCESSING${Math.floor(10000 + Math.random() * 90000)}`
          };
        }
        return p;
      }));
      
      triggerToast('🎉 Bank details updated! Verification initiated.');
    }, 2000);
  };

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
      <header className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[--page-margin] h-16">
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
            <h1 className="text-base font-black text-gray-900 tracking-tight">Payout History</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase block -mt-0.5">Disbursement ledger</span>
          </div>
        </div>
        <button
          onClick={() => triggerToast('📅 Filtered for current 30-day payout cycles.')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
        >
          <Calendar size={18} />
        </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-6 pb-16 px-[--page-margin] space-y-5">
        
        {/* Dynamic Metrics Section */}
        <section className="bg-primary rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          
          <div className="relative z-10 space-y-4">
            <div>
              <span className="text-[10px] text-pink-200 font-bold uppercase tracking-wider block mb-0.5">Available for Payout</span>
              <h2 className="text-3xl font-black tracking-tight">₹8,400</h2>
            </div>
            
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-xl py-2 px-3 backdrop-blur-md text-[11px] font-bold">
              <Clock size={13} className="text-pink-300" />
              <span>Next Automated Tuesday Payout: 04 Aug 2026</span>
            </div>
          </div>
        </section>

        {/* Paid and Verification Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-200/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Paid Out</span>
            </div>
            <div className="text-lg font-black text-gray-900">₹59,600</div>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-gray-200/60 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock size={15} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Bank Verification</span>
            </div>
            <div className="text-lg font-black text-gray-900">₹3,250</div>
          </div>
        </section>

        {/* Payout List */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Disbursement Logs</h3>
            <span className="text-[10px] text-gray-400 font-semibold">Tap to view Receipt</span>
          </div>

          <div className="space-y-3">
            {payouts.map((p) => {
              const isCompleted = p.status === 'Completed';
              const isProcessing = p.status === 'Processing';
              const isFailed = p.status === 'Failed';

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-4 border border-gray-200/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden flex justify-between items-center group`}
                  onClick={() => setSelectedPayout(p)}
                >
                  {/* Color Left-Indicator bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isCompleted ? 'bg-emerald-500' : isProcessing ? 'bg-blue-500' : 'bg-red-500'
                  }`}></div>

                  <div className="pl-1.5 flex gap-3.5 items-start">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted ? 'bg-emerald-50 text-emerald-600' : isProcessing ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={18} /> : isProcessing ? <Clock size={18} /> : <XCircle size={18} />}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900">₹{p.amount.toLocaleString()}</h4>
                      <p className="text-[10px] text-gray-400 font-bold block mt-0.5">{p.date} • {p.bankName} ({p.bankAccount})</p>
                      {isFailed && (
                        <p className="text-[9px] text-red-500 font-extrabold mt-1 block">Click to resolve issues now</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isCompleted 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : isProcessing 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-red-50 text-red-700'
                    }`}>
                      {p.status}
                    </span>
                    
                    {isFailed ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowResolveModal(true);
                        }}
                        className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-xl hover:bg-primary-container transition-all"
                      >
                        Resolve
                      </button>
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Modal A: Resolve Bank Details */}
      {showResolveModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowResolveModal(false)}
          ></div>

          <form
            onSubmit={handleResolveSubmit}
            className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>Resolve Payout Block</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-red-700 leading-normal font-medium">
                  Your last payout of <strong>₹7,200</strong> failed. Error: Incorrect IFSC code or invalid bank account structure. Please verify details to trigger instant auto-reprocessing.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">IFSC Bank Code</label>
                <input
                  type="text"
                  value={newIFSC}
                  onChange={(e) => setNewIFSC(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950 uppercase"
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Bank Account Number</label>
                <input
                  type="text"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  placeholder="e.g. 348291048940"
                />
              </div>

              <button
                type="submit"
                disabled={isResolving}
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {isResolving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Updating Details...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Submit & Retry Transfer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal B: Payout Detail Receipt */}
      {selectedPayout && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedPayout(null)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div>
                <span className="text-[9px] font-black text-primary bg-pink-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Transfer Voucher
                </span>
                <h3 className="text-sm font-black text-gray-900 mt-1">{selectedPayout.payoutId}</h3>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Transfer Amount</span>
                <span className="font-extrabold text-primary text-sm">₹{selectedPayout.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Initiation Date</span>
                <span className="font-semibold text-gray-700">{selectedPayout.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Destination Bank</span>
                <span className="font-bold text-gray-800">{selectedPayout.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Account Index</span>
                <span className="font-mono font-bold text-gray-700">{selectedPayout.bankAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Bank UTR Number</span>
                <span className="font-mono font-bold text-gray-900">{selectedPayout.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold">Disbursement ID</span>
                <span className="font-bold text-gray-700">{selectedPayout.payoutId}</span>
              </div>
            </div>

            {selectedPayout.status === 'Completed' && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800">Transferred Successfully</p>
                  <p className="text-[10px] text-emerald-600 leading-normal mt-0.5">Funds have successfully hit your verified bank account via IMPS instant UPI clearing network.</p>
                </div>
              </div>
            )}

            {selectedPayout.status === 'Processing' && (
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <Clock size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-800">In Transit</p>
                  <p className="text-[10px] text-blue-600 leading-normal mt-0.5">Bank clearing systems are matching IFSC details. Estimated credit within 4 hours.</p>
                </div>
              </div>
            )}

            {selectedPayout.status === 'Failed' && (
              <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800">Transfer Terminated</p>
                  <p className="text-[10px] text-red-600 leading-normal mt-0.5">{selectedPayout.failureReason}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  triggerToast('Receipt Voucher copy shared!');
                  setSelectedPayout(null);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 rounded-xl font-bold transition-colors flex items-center justify-center gap-1"
              >
                Share Voucher
              </button>
              {selectedPayout.status === 'Failed' && (
                <button
                  onClick={() => {
                    setSelectedPayout(null);
                    setShowResolveModal(true);
                  }}
                  className="flex-1 bg-primary hover:bg-primary-container text-white h-10 rounded-xl font-bold transition-all"
                >
                  Resolve Block
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <BottomNav onNavigate={onNavigate} currentPage="earnings" />

    </div>
  );
}
