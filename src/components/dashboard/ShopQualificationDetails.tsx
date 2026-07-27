import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  MoreVertical,
  CheckCircle2,
  Calendar,
  DollarSign,
  QrCode,
  Phone,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Info,
  ChevronRight,
  Plus,
  RefreshCw,
  FileText,
  Clock,
  Sparkles,
  Award,
  HelpCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  time: string;
  amount: number;
  status: 'Successful' | 'Pending' | 'Failed';
  utr: string;
}

interface DayLog {
  day: number;
  date: string;
  amount: number;
  status: 'Passed' | 'Failed' | 'Pending';
}

export default function ShopQualificationDetails({
  onBack,
  onNavigate
}: {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}) {
  // Real-time state for simulated transactions
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([
    { id: '1', time: '11:30 AM', amount: 350, status: 'Successful', utr: '612345987123' },
    { id: '2', time: '02:15 PM', amount: 250, status: 'Successful', utr: '612345987124' },
  ]);

  // Streak logs for the 15-day cycle
  const [dayLogs, setDayLogs] = useState<DayLog[]>([
    { day: 1, date: '18 Jul', amount: 1320, status: 'Passed' },
    { day: 2, date: '19 Jul', amount: 1050, status: 'Passed' },
    { day: 3, date: '20 Jul', amount: 1200, status: 'Passed' },
    { day: 4, date: '21 Jul', amount: 1430, status: 'Passed' },
    { day: 5, date: '22 Jul', amount: 1110, status: 'Passed' },
    { day: 6, date: '23 Jul', amount: 1500, status: 'Passed' },
    { day: 7, date: '24 Jul', amount: 1020, status: 'Passed' },
    { day: 8, date: '25 Jul', amount: 1850, status: 'Passed' },
    { day: 9, date: '26 Jul', amount: 600, status: 'Pending' }, // Starts at 350+250 = 600
    { day: 10, date: '27 Jul', amount: 0, status: 'Pending' },
    { day: 11, date: '28 Jul', amount: 0, status: 'Pending' },
    { day: 12, date: '29 Jul', amount: 0, status: 'Pending' },
    { day: 13, date: '30 Jul', amount: 0, status: 'Pending' },
    { day: 14, date: '31 Jul', amount: 0, status: 'Pending' },
    { day: 15, date: '01 Aug', amount: 0, status: 'Pending' },
  ]);

  // Quick states
  const [simAmount, setSimAmount] = useState<string>('400');
  const [activeTab, setActiveTab] = useState<'progress' | 'transactions' | 'calculator'>('progress');
  const [callLog, setCallLog] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Calculate current sum for Today (Day 9)
  const todaySum = todayTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const targetMin = 1000;
  const isTodayPassed = todaySum >= targetMin;
  const deficit = isTodayPassed ? 0 : targetMin - todaySum;

  // Sync today's sum with Day 9 in dayLogs
  useEffect(() => {
    setDayLogs(prevLogs =>
      prevLogs.map(log => {
        if (log.day === 9) {
          return {
            ...log,
            amount: todaySum,
            status: todaySum >= targetMin ? 'Passed' : 'Pending',
          };
        }
        return log;
      })
    );
  }, [todaySum]);

  // Simulate a new transaction
  const handleSimulatePayment = () => {
    const amt = parseInt(simAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    const newTx: Transaction = {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: amt,
      status: 'Successful',
      utr: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
    };

    setTodayTransactions([newTx, ...todayTransactions]);
    
    // Show dynamic success toast/notification
    triggerNotification(`🎉 Real-time payment of ₹${amt} processed successfully!`);
  };

  // Helper to trigger floating alert
  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Predefined templates for WhatsApp reach out
  const handleSendReminder = (lang: 'hi' | 'en') => {
    const message = lang === 'hi'
      ? `नमस्ते सुनिता जी! आपके "Glow Beauty Parlour" का आज का क्वालिफिकेशन पूरा करने के लिए केवल ₹${deficit} का ट्रांजैक्शन बाकी है। कृपया आज रात 12 बजे से पहले इसे पूरा करें ताकि आपकी 15-दिन की कमाई श्रृंखला चालू रहे। धन्यवाद!`
      : `Hello Sunita! Your shop "Glow Beauty Parlour" needs only ₹${deficit} more in QR payments to clear today's limit. Please process a payment before midnight to secure your 15-day streak reward!`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919876512345?text=${encoded}`, '_blank');
    setCallLog([`WhatsApp reminder sent (${lang === 'hi' ? 'Hindi' : 'English'}) at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, ...callLog]);
  };

  const handleCallMerchant = () => {
    alert("Initiating simulator call to +91 98765 12345 (Sunita Sharma)...");
    setCallLog([`Dialed merchant: promised to route ₹${deficit} client payment at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, ...callLog]);
    triggerNotification("📞 Call logged in your Growth Partner CRM history.");
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-20 font-sans max-w-md mx-auto shadow-lg border-x border-gray-100">
      
      {/* Floating Action Notifications */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top duration-300">
          <Sparkles size={16} className="text-pink-400 shrink-0 animate-bounce" />
          <span className="font-semibold leading-snug">{showNotification}</span>
        </div>
      )}

      {/* Top App Bar */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 bg-white/85 backdrop-blur-md shadow-xs h-16 flex justify-between items-center px-4 max-w-md mx-auto border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} className="stroke-[2.5px]" />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">Glow Beauty Parlour</h1>
            <span className="text-[10px] text-gray-400 font-semibold uppercase block">Qualification Details</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onNavigate('notifications')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b90064] rounded-full"></span>
          </button>
          <button 
            onClick={() => alert("Options: Download QR Standee, Print Onboarding Form, Verify Store Coordinates")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 pb-16 px-4 space-y-5">

        {/* 1. Shop Hero & Quick Summary */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200/60 flex gap-4 items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100 shadow-inner relative">
            <img
              className="w-full h-full object-cover"
              alt="Glow Beauty Parlour Interior"
              referrerPolicy="no-referrer"
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-gray-900 tracking-tight truncate">Glow Beauty Parlour</h2>
            <p className="text-[11px] text-gray-500 font-medium leading-normal mt-0.5">
              ID: <span className="font-bold text-gray-700">NX-SHOP-0247</span> • Owner: <span className="font-bold text-gray-700">Sunita Sharma</span>
            </p>
            <p className="text-[11px] text-gray-500 font-medium leading-normal">
              Mobile: <span className="font-semibold">+91 98765 12345</span> • Area: <span className="font-semibold">Mansarovar, Jaipur</span>
            </p>
            
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-bold">
                Approved
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-bold">
                KYC Verified
              </span>
              <span className="px-2 py-0.5 bg-pink-50 text-primary border border-pink-100 rounded-full text-[9px] font-bold">
                15-Day Cycle
              </span>
            </div>
          </div>
        </section>

        {/* 2. Qualification Highlight Header */}
        <section className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-pink-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-pink-50 rounded-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">Live Streak Track</span>
              <h3 className="text-lg font-black text-gray-900">QR Qualification Cycle</h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="bg-pink-50 border border-pink-100 text-primary text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <Award size={13} className="fill-primary" />
                9/15 Days Complete
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-extrabold text-gray-800">Day 9 of 15</span>
              <span className={`font-black ${isTodayPassed ? 'text-emerald-600' : 'text-primary'}`}>
                {isTodayPassed ? 'Today Qualified! 🎉' : `₹${deficit} remaining today`}
              </span>
            </div>
            
            {/* Dynamic Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200/30 shadow-inner">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                  isTodayPassed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-primary shadow-[0_0_8px_rgba(230,0,126,0.3)]'
                }`}
                style={{ width: `${Math.min(100, (todaySum / targetMin) * 100)}%` }}
              ></div>
            </div>

            {/* Overall streak tracker indicators */}
            <div className="grid grid-cols-15 gap-1 mt-3">
              {dayLogs.map((log) => (
                <div
                  key={log.day}
                  title={`Day ${log.day}: ₹${log.amount} (${log.status})`}
                  className={`h-2 rounded-xs transition-colors duration-300 ${
                    log.day === 9 
                      ? isTodayPassed ? 'bg-emerald-500' : 'bg-primary animate-pulse'
                      : log.status === 'Passed'
                        ? 'bg-emerald-500'
                        : 'bg-gray-200'
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Started</span>
                <span className="font-bold text-gray-800">18 Jul 2026</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Target Finish</span>
                <span className="font-bold text-gray-800">01 Aug 2026</span>
              </div>
            </div>
          </div>

          <div className="bg-pink-50/40 rounded-2xl p-3 border border-pink-100/50 mt-4 flex items-start gap-2.5">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-gray-600 leading-normal font-medium">
              Merchant stands to qualify for a massive <strong className="text-primary">₹3,500 onboarding incentive</strong> once they complete 15 consecutive days with a minimum of ₹1,000 QR transaction volume per day.
            </p>
          </div>
        </section>

        {/* 3. Sub-tab Navigation */}
        <div className="bg-white rounded-2xl p-1 border border-gray-200/50 flex shadow-inner">
          {[
            { id: 'progress', label: 'Streak Calendar' },
            { id: 'transactions', label: 'Today Payments' },
            { id: 'calculator', label: 'Target Helper' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Streak Calendar */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>15-Day Consecutive Status</span>
                <span className="text-[10px] text-gray-400 font-semibold normal-case">Tap item to view rules</span>
              </h4>

              <div className="grid grid-cols-5 gap-3">
                {dayLogs.map((log) => {
                  const isCurrent = log.day === 9;
                  const isPassed = log.status === 'Passed';
                  
                  return (
                    <div
                      key={log.day}
                      className={`relative rounded-2xl p-2.5 border text-center transition-all ${
                        isCurrent
                          ? isTodayPassed
                            ? 'bg-emerald-50 border-emerald-200 shadow-xs'
                            : 'bg-pink-50/50 border-primary shadow-xs ring-1 ring-primary/20'
                          : isPassed
                            ? 'bg-emerald-50/30 border-emerald-100'
                            : 'bg-gray-50 border-gray-100/80'
                      }`}
                    >
                      <span className={`text-[10px] font-extrabold block ${
                        isCurrent ? 'text-primary' : 'text-gray-400'
                      }`}>
                        Day {log.day}
                      </span>
                      <span className="text-[11px] font-black text-gray-900 block mt-1">
                        ₹{log.amount}
                      </span>
                      <span className="text-[9px] text-gray-500 block mt-0.5">
                        {log.date}
                      </span>
                      
                      {/* Status Icon Indicator */}
                      <div className="absolute -top-1.5 -right-1.5">
                        {isCurrent ? (
                          isTodayPassed ? (
                            <span className="bg-emerald-500 text-white rounded-full p-0.5 block shadow-xs">
                              <CheckCircle2 size={10} className="stroke-[3px]" />
                            </span>
                          ) : (
                            <span className="bg-primary text-white rounded-full p-0.5 block shadow-xs animate-pulse">
                              <Clock size={10} className="stroke-[3px]" />
                            </span>
                          )
                        ) : isPassed ? (
                          <span className="bg-emerald-500 text-white rounded-full p-0.5 block shadow-xs">
                            <CheckCircle2 size={10} className="stroke-[3px]" />
                          </span>
                        ) : (
                          <span className="bg-gray-300 text-white rounded-full p-0.5 block shadow-xs">
                            <Clock size={10} className="stroke-[3px]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (Call/Whatsapp reminders) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                Partner Streak Maintenance tools
              </h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                If the merchant is busy or hasn't finished today's qualifying transaction, use these fast actions to help them before 12:00 midnight!
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCallMerchant}
                  className="bg-primary text-white h-11 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-98 hover:bg-primary/95 transition-colors cursor-pointer"
                >
                  <Phone size={14} /> Call Merchant
                </button>
                <button
                  onClick={() => handleSendReminder('hi')}
                  className="bg-emerald-600 text-white h-11 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-98 hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <MessageSquare size={14} /> Send Hindi WA
                </button>
              </div>
              <button
                onClick={() => handleSendReminder('en')}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 h-10 rounded-xl text-xs font-bold transition-all border border-gray-200/50 flex items-center justify-center gap-1"
              >
                Send English WhatsApp Alert
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 2: Today's Real-time Payments & Simulator */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            
            {/* Real-Time Transaction Simulator */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                <Sparkles size={16} />
                <span>Simulate QR Payment (Testing Tool)</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal font-medium">
                Simulate a real-time QR scanner purchase by a customer to observe dynamic streak progression!
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full h-11 pl-7 pr-3 bg-gray-50 rounded-2xl border-none font-bold text-xs focus:ring-1 focus:ring-primary/20 text-gray-950"
                    placeholder="Enter amount"
                  />
                </div>
                <button
                  onClick={handleSimulatePayment}
                  className="bg-primary text-white px-5 rounded-2xl font-extrabold text-xs hover:bg-primary/95 transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Scan & Pay
                </button>
              </div>

              {/* Quick pre-select amounts */}
              <div className="flex gap-1.5 pt-1">
                {['150', '250', '400', '1000'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSimAmount(val)}
                    className={`py-1 px-3 rounded-lg text-[10px] font-bold border transition-colors ${
                      simAmount === val
                        ? 'bg-primary/5 text-primary border-primary/20'
                        : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Log list */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-3.5 flex justify-between items-center">
                <span>Today's Live Payments ({todayTransactions.length})</span>
                <span className="text-emerald-600 font-bold text-[11px]">Today: ₹{todaySum}</span>
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pr-1">
                {todayTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        QR
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-900 block">QR Code Scan</span>
                        <span className="text-[10px] text-gray-400 block font-semibold mt-0.5">UTR: {tx.utr} • {tx.time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-gray-900 block text-xs">₹{tx.amount}</span>
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab Content 3: Target Calculator Helper */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                Deficit Target Helper
              </h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                Calculate the exact business layout and remaining transaction combinations to complete today's target successfully.
              </p>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-semibold">Today's Accumulated</span>
                  <span className="font-black text-gray-900">₹{todaySum} / ₹1,000</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, (todaySum / 1000) * 100)}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-gray-200/60 pt-2.5">
                  <span className="text-gray-500 font-bold">Deficit To Solve</span>
                  <span className={`font-black ${isTodayPassed ? 'text-emerald-600' : 'text-red-500 text-sm'}`}>
                    ₹{deficit}
                  </span>
                </div>
              </div>

              {!isTodayPassed ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Recommended Service Combinations</p>
                  <div className="space-y-1.5">
                    {[
                      { service: 'Haircut & Trim', price: 200, count: Math.ceil(deficit / 200) },
                      { service: 'Basic Facials', price: 500, count: Math.ceil(deficit / 500) },
                      { service: 'Premium Waxing', price: 350, count: Math.ceil(deficit / 350) }
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-700">{item.service} (₹{item.price})</span>
                        <span className="font-black text-gray-900">
                          Need {item.count} client transaction{item.count > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center space-y-1.5">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                  <p className="text-xs font-black text-emerald-800">Target Cleared! 🌟</p>
                  <p className="text-[10.5px] text-emerald-600 leading-snug">Glow Beauty Parlour has satisfied the daily qualifying volume of ₹1,000. No further manual tracking is needed for Day 9.</p>
                </div>
              )}
            </div>

            {/* Fraud / Safety Guidelines */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm space-y-2.5">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1 text-amber-600">
                <AlertCircle size={14} />
                <span>Quality Audit & Anti-Fraud Rules</span>
              </h4>
              <ul className="space-y-2 text-[11px] text-gray-600 leading-relaxed font-medium">
                <li className="flex gap-2 items-start">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>No Self-Pay:</strong> Transactions done by the Growth Partner or the merchant using their own cards/phones are auto-flagged and rejected.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Unique Clients:</strong> Payments must be made by genuine clients for salon services rendered. Repeated identical transactions from the same mobile ID are audited.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 4. CRM History Log */}
        <section className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm space-y-3.5">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">CRM Touchpoint logs</h3>
          
          <div className="space-y-2">
            {callLog.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic text-center py-2">No calls or reminders logged for today yet.</p>
            ) : (
              callLog.map((log, idx) => (
                <div key={idx} className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs flex gap-2 items-start">
                  <span className="text-primary font-bold">•</span>
                  <span className="text-gray-700 leading-normal font-medium">{log}</span>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

    </div>
  );
}
