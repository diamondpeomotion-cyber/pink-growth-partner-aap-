import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  Info,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Plus,
  X,
  Gift,
  TrendingUp,
  AlertTriangle,
  Zap,
  Check,
  Star,
  Store
} from 'lucide-react';
import rewardScooter from '../../assets/images/reward-scooter.jpg';
import BottomNav from './BottomNav';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchMyAttributions } from '../../lib/gpRepository';

interface RewardShop {
  id: string;
  name: string;
  code: string;
  status: 'Verified' | 'Pending';
  onboardedDate: string;
  activeScansCount: number;
  daysRemaining?: number;
}



export default function RewardsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack: () => void;
}) {
  // Live qualifying count: active shops attributed to this partner.
  const [qualifyingCount, setQualifyingCount] = useState<number>(0);
  const [allShops, setAllShops] = useState<RewardShop[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const partner = await resolveGrowthPartner(supabase, user.id);
        if (!partner || cancelled) return;
        const rows = await fetchMyAttributions(supabase, String(partner.id));
        if (cancelled) return;
        const active = rows.filter((a) => a.status === 'active');
        setQualifyingCount(active.length);
        setAllShops(active.map((a) => ({
          id: String(a.id),
          name: a.salon_name ?? 'Shop',
          code: a.salon_name ?? '',
          status: 'Verified' as const,
          onboardedDate: a.effective_from ? new Date(a.effective_from).toISOString().slice(0, 10) : '',
          activeScansCount: 0,
        })));
      } catch (err) {
        console.warn('Rewards progress load failed:', err);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);
  
  // Modal controllers
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [showShopList, setShowShopList] = useState(false);
  const [showOnboardShop, setShowOnboardShop] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  
  // Modal Tab
  const [modalTab, setModalTab] = useState<'Verified' | 'Pending'>('Verified');

  // Interactive Form state
  const [newShopName, setNewShopName] = useState('');
  const [newShopScans, setNewShopScans] = useState('15');
  const [instantQualify, setInstantQualify] = useState(true);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Stats matching the HTML calculations
  const stats = useMemo(() => {
    const completed = qualifyingCount;
    const neededForMilestone = Math.max(0, 250 - qualifyingCount);
    const claimUnlockAt = 251;
    const toUnlockClaim = Math.max(0, 251 - qualifyingCount);
    const progressPercent = Math.min(100, Number(((qualifyingCount / 250) * 100).toFixed(1)));

    return {
      completed,
      neededForMilestone,
      claimUnlockAt,
      toUnlockClaim,
      progressPercent
    };
  }, [qualifyingCount]);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      triggerToast('❌ Please provide a shop name!');
      return;
    }

    const nextId = `sim-shop-${Date.now()}`;
    const nextCode = `NX-SHOP-0${Math.floor(400 + Math.random() * 500)}`;
    const scans = parseInt(newShopScans) || 0;

    const newShop: RewardShop = {
      id: nextId,
      name: newShopName,
      code: nextCode,
      status: instantQualify ? 'Verified' : 'Pending',
      onboardedDate: 'Today',
      activeScansCount: scans,
      daysRemaining: instantQualify ? undefined : 15
    };

    setAllShops([newShop, ...allShops]);
    
    if (instantQualify) {
      setQualifyingCount(prev => prev + 1);
      triggerToast(`🎉 ${newShopName} successfully onboarded & qualified! Progress increased!`);
    } else {
      triggerToast(`⏳ ${newShopName} registered. Verification process initiated.`);
    }

    setNewShopName('');
    setShowOnboardShop(false);
  };

  const handleForceQualifyShop = (id: string, name: string) => {
    setAllShops(prev => prev.map(s => s.id === id ? { ...s, status: 'Verified', daysRemaining: undefined } : s));
    setQualifyingCount(prev => prev + 1);
    triggerToast(`⚡ Manual audit completed! ${name} is now certified.`);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100">
      
      {/* Dynamic Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-110 bg-gray-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 w-[90%] max-w-xs animate-in fade-in slide-in-from-top">
          <Sparkles size={16} className="text-pink-400 shrink-0 animate-pulse" />
          <span className="font-semibold leading-normal">{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 w-full z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-xs h-16">
        <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[var(--page-margin)] h-16">
          <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#b90064] hover:bg-pink-50 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">Rewards</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase block -mt-0.5">Milestone Target</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
            title="How Qualification Works"
          >
            <Info size={18} />
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors relative cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b90064] rounded-full"></span>
          </button>
        </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-4 pb-16 px-[var(--page-margin)] space-y-5">

        {/* Mandatory Notice Banner */}
        <section className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-4 flex gap-3 items-start shadow-3xs">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-[11px] text-gray-900 font-extrabold">Only verified qualifying shops are counted towards rewards.</p>
            <p className="text-[10.5px] text-gray-500 leading-normal font-semibold">
              Shop registration, KYC submission or QR installation alone does not increase reward progress.
            </p>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-primary font-bold text-xs flex items-center gap-1 mt-1 hover:underline cursor-pointer"
            >
              How a Shop Qualifies <ArrowRight size={13} />
            </button>
          </div>
        </section>

        {/* Current Reward Hero Card */}
        <section className="bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden relative">
          
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary z-10"></div>
          
          {/* Cover image area */}
          <div className="h-44 w-full relative overflow-hidden bg-gray-100">
            <img
              className="w-full h-full object-cover object-center"
              src={rewardScooter}
              alt="Electric Scooter Reward"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
            
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full mb-1.5">
                <Zap size={11} className="text-primary fill-primary" />
                <span className="text-[9px] font-black text-primary uppercase tracking-wider">Current Milestone</span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Electric Scooter</h2>
              <p className="text-[11px] text-white/80 font-bold">Value: Up to ₹1,05,000</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            
            {/* Progress metrics */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign Progress</span>
                <span className="text-sm font-black text-primary">{stats.completed} / 250</span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${stats.progressPercent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                <span>0 Shop Milestones</span>
                <span>Qualifying Active Shops</span>
              </div>
            </div>

            {/* Stats matrix matching exact values of layout */}
            <div className="grid grid-cols-2 gap-2.5">
              
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Completed</span>
                <span className="text-sm font-black text-gray-800">{stats.completed}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Remaining for Milestone</span>
                <span className="text-sm font-black text-gray-800">{stats.neededForMilestone}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Claim Unlock At</span>
                <span className="text-sm font-black text-primary">{stats.claimUnlockAt}</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col gap-0.5">
                <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider">Needed to Claim</span>
                <span className="text-sm font-black text-primary">{stats.toUnlockClaim}</span>
              </div>

            </div>

            {/* Campaign tip matching HTML copy */}
            <div className="bg-pink-50/40 p-3 rounded-2xl border border-pink-100/50 text-[11px] text-gray-600 leading-normal font-medium">
              Reach <span className="text-primary font-black">250 qualifying shops</span> to complete the milestone campaign. Add {stats.toUnlockClaim} more verified qualifying shops to unlock the claim flow at 251 shops.
            </div>

            {/* Primary Action Row */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => onNavigate('reward-details')}
                className="flex-1 bg-primary text-white font-bold h-11 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                View Reward Details
              </button>
              <button
                onClick={() => setShowShopList(true)}
                className="flex-1 bg-pink-50 text-primary border border-pink-100 font-bold h-11 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                Qualifying Shop List
              </button>
            </div>

            {/* Claim button if criteria met */}
            {qualifyingCount >= 251 && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-md animate-bounce"
              >
                <Gift size={15} /> CLAIM SCOOTER REWARD UNLOCKED!
              </button>
            )}

          </div>
        </section>

        {/* Milestone Tracker Sandbox Area */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/60 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={13} className="text-primary" /> Reward Milestones Simulator
              </h3>
              <p className="text-[10px] text-gray-400 font-bold block mt-0.5">Test targets and verify payouts</p>
            </div>
            <button
              onClick={() => setShowOnboardShop(true)}
              className="bg-primary hover:bg-pink-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={11} /> <span>Add Shop</span>
            </button>
          </div>

          {/* Quick interactive sliders to change the count and instantly test state validations */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-700">
                <span>Set Qualifying Shops (Simulation)</span>
                <span className="text-primary font-black">{qualifyingCount} Shops</span>
              </div>
              <input
                type="range"
                min="240"
                max="255"
                value={qualifyingCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setQualifyingCount(val);
                  if (val === 250) {
                    triggerToast('🏆 Milestone 250 completed! 1 more shop to claim scooter!');
                  } else if (val >= 251) {
                    triggerToast('🎁 Congratulation! You can now tap Claim Scooter Reward!');
                  }
                }}
                className="w-full accent-primary cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
              <p className="text-[9.5px] text-gray-400 font-medium">Drag to simulate onboarding verification flows between 240 and 255 shops.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <button 
                onClick={() => {
                  setQualifyingCount(247);
                  triggerToast('🔄 Reset simulation back to default (247)');
                }}
                className="bg-white border border-gray-200 rounded-xl py-1.5 font-bold hover:bg-gray-50 active:scale-95 cursor-pointer text-gray-600"
              >
                Reset Default
              </button>
              <button 
                onClick={() => {
                  setQualifyingCount(250);
                  triggerToast('⭐ Advanced progress to 250 (Milestone Complete)');
                }}
                className="bg-white border border-gray-200 rounded-xl py-1.5 font-bold hover:bg-gray-50 active:scale-95 cursor-pointer text-gray-600"
              >
                Set 250
              </button>
              <button 
                onClick={() => {
                  setQualifyingCount(251);
                  triggerToast('🔥 Unlocked Claim Scooter Reward (251)');
                }}
                className="bg-white border border-gray-200 rounded-xl py-1.5 font-bold hover:bg-gray-50 active:scale-95 cursor-pointer text-gray-600"
              >
                Set 251
              </button>
            </div>
          </div>
        </section>

        {/* Recently onboarded verification status lists */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-200/60 space-y-3.5 overflow-hidden">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider truncate">
              Recent Onboarding Pipeline
            </h3>
            <span className="text-[10px] text-gray-400 font-bold shrink-0">Latest 5 of {allShops.length} entries</span>
          </div>

          <div className="space-y-2.5">
            {allShops.slice(0, 5).map((shop) => {
              const isVerified = shop.status === 'Verified';

              return (
                <div 
                  key={shop.id}
                  className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 flex justify-between items-center text-xs gap-2 overflow-hidden"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">{shop.name}</p>
                    <p className="text-[9.5px] text-gray-400 font-bold block mt-0.5 truncate">{shop.code} • Onboarded: {shop.onboardedDate}</p>
                  </div>

                  <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-black ${
                        isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {shop.status}
                      </span>
                      {!isVerified && (
                        <p className="text-[9px] text-gray-400 font-semibold block mt-1">Needs {15 - shop.activeScansCount} scans</p>
                      )}
                    </div>

                    {!isVerified && (
                      <button
                        onClick={() => handleForceQualifyShop(shop.id, shop.name)}
                        className="bg-emerald-600 text-white p-2 rounded-xl text-[10px] font-bold shadow-2xs hover:bg-emerald-700 active:scale-90 cursor-pointer shrink-0 flex items-center justify-center"
                        title="Audit & Qualify"
                      >
                        <Check size={13} className="stroke-[3px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Modal A: How a Shop Qualifies (Step-by-step documentation) */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowHowItWorks(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-primary font-black text-xs uppercase tracking-wider flex items-center gap-1">
                <Star size={14} className="fill-primary text-primary" />
                <span>Shop Qualification Rules</span>
              </span>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-400 hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5 text-gray-600 leading-normal font-medium">
              <p className="text-gray-900 font-bold">
                To prevent fraud and maintain quality campaigns, a shop must fulfill these criteria to become a "Qualifying Shop" toward rewards:
              </p>
              
              <div className="space-y-2">
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-primary font-black text-[10px] shrink-0 mt-0.5">1</div>
                  <p><strong>KYC Completion</strong>: Merchant KYC documentation must be verified by the admin.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-primary font-black text-[10px] shrink-0 mt-0.5">2</div>
                  <p><strong>Minimum Active Scan</strong>: Shop must clear at least 15 customer payments via Nexora QR codes within the first 15 days.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center text-primary font-black text-[10px] shrink-0 mt-0.5">3</div>
                  <p><strong>Minimum Value</strong>: Only payments above ₹30 of transaction values are counted toward active scans.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Modal B: Reward Details (Electric Scooter specs) */}
      {showRewardDetails && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowRewardDetails(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95">
            <div className="h-40 relative bg-gray-100">
              <img
                className="w-full h-full object-cover"
                src={rewardScooter}
                alt="Electric Scooter"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <button
                onClick={() => setShowRewardDetails(false)}
                className="absolute right-3 top-3 bg-white/20 hover:bg-white/40 text-white p-1 rounded-full cursor-pointer"
              >
                <X size={15} />
              </button>
              <div className="absolute bottom-3 left-4 text-white text-xs font-extrabold">
                🛵 Ola S1 Air / Equivalent Premium EV
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Specifications</span>
                <div className="grid grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <p className="text-gray-400 font-semibold text-[9px] uppercase">Peak Value</p>
                    <p className="font-black text-gray-800">₹1,05,000</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <p className="text-gray-400 font-semibold text-[9px] uppercase">Range/Charge</p>
                    <p className="font-black text-gray-800">125 KM True Range</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <p className="text-gray-400 font-semibold text-[9px] uppercase">Charging Time</p>
                    <p className="font-black text-gray-800">4.5 Hrs (Home)</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <p className="text-gray-400 font-semibold text-[9px] uppercase">Cash Alterative</p>
                    <p className="font-black text-emerald-600">₹90,000 Payout</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 text-amber-800 p-3 rounded-2xl border border-amber-100/50 leading-normal">
                📌 Road taxes, mandatory registrations, and insurance covered. Subject to tax regulations where applicable.
              </div>

              <button
                onClick={() => setShowRewardDetails(false)}
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal C: Qualifying Shop List View */}
      {showShopList && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowShopList(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div>
                <span className="text-primary font-black text-xs uppercase tracking-wider flex items-center gap-1">
                  <Store size={14} /> Qualifying Shops Registry
                </span>
                <p className="text-[10px] text-gray-400 font-bold block mt-0.5">Showing registered partner portfolio</p>
              </div>
              <button
                onClick={() => setShowShopList(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Selector Tab */}
            <div className="flex px-5 pt-3.5 gap-2 shrink-0">
              <button
                onClick={() => setModalTab('Verified')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  modalTab === 'Verified'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Verified Active ({allShops.filter(s => s.status === 'Verified').length + 243})
              </button>
              <button
                onClick={() => setModalTab('Pending')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  modalTab === 'Pending'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Pending Pipeline ({allShops.filter(s => s.status === 'Pending').length})
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              
              {modalTab === 'Verified' ? (
                <>
                  <div className="bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-100/50 text-emerald-800 text-[10px] font-semibold leading-normal">
                    💡 Verified shops completed 15 scans & cleared KYC criteria. Currently showing first {allShops.filter(s => s.status === 'Verified').length} of {qualifyingCount} verified partners.
                  </div>
                  {allShops.filter(s => s.status === 'Verified').map((s) => (
                    <div key={s.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
                      <div>
                        <p className="font-extrabold text-gray-900">{s.name}</p>
                        <p className="text-[9.5px] text-gray-400 font-bold block mt-0.5">{s.code} • {s.onboardedDate}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                        {s.activeScansCount} Scans
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="bg-amber-50/50 p-2.5 rounded-2xl border border-amber-100/50 text-amber-800 text-[10px] font-semibold leading-normal">
                    ⚠️ Pipeline shops need 15 active scans above ₹30 value inside 15 days to count toward scooter milestones.
                  </div>
                  {allShops.filter(s => s.status === 'Pending').length === 0 ? (
                    <div className="text-center py-6 text-gray-400 font-bold">No shops in verification pipeline</div>
                  ) : (
                    allShops.filter(s => s.status === 'Pending').map((s) => (
                      <div key={s.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="font-extrabold text-gray-900">{s.name}</p>
                          <p className="text-[9.5px] text-gray-400 font-bold block mt-0.5">Code: {s.code} • Days Left: {s.daysRemaining || 15}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full block border border-amber-100/50">
                            {s.activeScansCount} / 15 Scans
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowShopList(false)}
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 cursor-pointer"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal D: Onboard and Simulate a new Partner shop */}
      {showOnboardShop && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowOnboardShop(false)}
          ></div>

          <form
            onSubmit={handleOnboardSubmit}
            className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="text-primary font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Store size={15} /> Onboard New Partner Shop
              </span>
              <button
                type="button"
                onClick={() => setShowOnboardShop(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Shop Name</label>
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. Royal Unisex Salon"
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Scans Count</label>
                <input
                  type="number"
                  value={newShopScans}
                  onChange={(e) => setNewShopScans(e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-1 focus:ring-primary/20 text-gray-950"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="font-bold text-gray-800 text-[11px] block">Instantly Qualify Shop</span>
                  <span className="text-[9.5px] text-gray-400 font-medium">Bypass 15 active scans audit period</span>
                </div>
                <input
                  type="checkbox"
                  checked={instantQualify}
                  onChange={(e) => setInstantQualify(e.target.checked)}
                  className="w-5 h-5 rounded-md text-primary focus:ring-primary border-gray-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} /> Register & Onboard Partner
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal E: Confetti / Claim Scooter Success Selector Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowClaimModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-pink-100 text-primary rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-md animate-pulse">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 tracking-tight">Milestone Claim Available!</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Electric Scooter Campaign</p>
            </div>

            <p className="text-xs text-gray-600 leading-normal font-semibold">
              Congratulations Rajesh! Your portfolio has hit <span className="text-primary font-black">{qualifyingCount} verified qualifying shops</span>. Select your claim payout preference below:
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  triggerToast('🛵 Choice registered: Electric Scooter! Shipment verification sent.');
                  setShowClaimModal(false);
                }}
                className="w-full py-3 px-4 bg-primary text-white rounded-2xl text-xs font-bold shadow-xs hover:bg-pink-700 active:scale-98 text-center cursor-pointer flex justify-center items-center gap-1"
              >
                Claim Electric Scooter (Deliver to KYC address)
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerToast('💰 Choice registered: ₹90,000 Cash Equivalent! direct bank settlement pending.');
                  setShowClaimModal(false);
                }}
                className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold hover:bg-emerald-100 active:scale-98 text-center cursor-pointer flex justify-center items-center gap-1"
              >
                Claim Cash Alternate (₹90,000 Direct Payout)
              </button>
            </div>

            <button
              onClick={() => setShowClaimModal(false)}
              className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mx-auto hover:text-gray-600 pt-2 cursor-pointer"
            >
              Cancel & Decide Later
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <BottomNav onNavigate={onNavigate} currentPage="rewards" />

    </div>
  );
}
