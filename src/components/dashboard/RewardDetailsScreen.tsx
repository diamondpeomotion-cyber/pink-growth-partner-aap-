import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Info,
  CheckCircle,
  Lock,
  Flag,
  Sparkles,
  Award,
  AlertTriangle,
  Gift,
  HelpCircle,
  Compass,
  Trophy,
  Check,
  Shield,
  Smartphone,
  Bike,
  Car,
  ChevronRight,
  Tablet,
  Laptop
} from 'lucide-react';
import BottomNav from './BottomNav';

interface MilestoneReward {
  id: number;
  name: string;
  milestoneShops: number;
  claimShops: number;
  maxValue: number;
  description: string;
  imgUrl?: string;
  specs: { label: string; value: string }[];
  checklist: string[];
}

const MILESTONES: MilestoneReward[] = [
  {
    id: 25,
    name: 'Welcome Package',
    milestoneShops: 25,
    claimShops: 26,
    maxValue: 5000,
    description: 'Welcome kit containing premium Nexora branding materials, QR stands, and merchant scanner devices to launch shop operations.',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsQYbhxh1DH7QoMmtAR5ST6vxphwEWTLFBw5QqCzRnVj6jeH_2ACDDy2p7G91iTvg4NGYZ2WD55CHo9gER282EBOFdypuHPiPEQfBB89nPCNvtJL-kA5zkUkhcQZhNOTRmTJldmrL9ipaq_JQrJRE5GsPgl2V0pRglqiUklHdLEejc94shDJ6S1-YyMESQ69jHJ5VWlTl2YRriwDivMDwqC56APcbxNg2Td9X_3-FT1KkirBYw9b1a-gAw',
    specs: [
      { label: 'Branding Banner', value: 'Includes 1 flex roll-up' },
      { label: 'QR Acrylic Stands', value: '5 counter-top premium stands' },
      { label: 'Welcome Booklet', value: 'Step-by-step payout guide' },
      { label: 'Window Stickers', value: '3 adhesive security decals' }
    ],
    checklist: [
      'KYC documents uploaded',
      'First 5 shop active scans',
      'Bank account link completed',
      'Welcome campaign signup'
    ]
  },
  {
    id: 50,
    name: 'Work Tablet',
    milestoneShops: 50,
    claimShops: 51,
    maxValue: 15000,
    description: 'A powerful, sleek 10.1-inch work tablet customized with pre-loaded merchant apps, analytics software, and instant scan notification systems.',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLvmOvLjk-ut4pLD7D9Zb8g5rpLksMs7Bhi_Zl6OmioDbyFjCODGUM9mnYDSHyR8cUnmO2LGS3FlFXrAf_Lxdx1q4mealfGaUCKiCftfmA-XIpwfJ3w8tho4CYEswzqgEuIFQJQn-ptEIT4bq3rPkAA7xyQgGEUebF4UbodQcU8c_BgBlatPMNEEn0_bf-aLySJYKSANfeG9XYUdqjKi53k75H07sKRLoJL96DTFBcMEHB3uuzhBkTHGmhg',
    specs: [
      { label: 'Display Size', value: '10.1" IPS Touchscreen' },
      { label: 'Performance', value: '4GB RAM + 64GB ROM' },
      { label: 'Software', value: 'Preloaded Nexora Dashboard' },
      { label: 'Warranty', value: '1-Year Brand Warranty' }
    ],
    checklist: [
      'Maintain 50+ active partner shops',
      'Completed shop health reviews',
      'Average monthly scans > 12',
      'No active dispute flags'
    ]
  },
  {
    id: 100,
    name: 'Laptop Reward',
    milestoneShops: 100,
    claimShops: 101,
    maxValue: 35000,
    description: 'Professional high-performance laptop designed for advanced analytics, inventory sheets, merchant reports, and full administration of the shop network.',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsgm41kqjSpqbXSFtRAeMlu_H4XiGRe_Ow7dN-vsSMI985s91UMSHaubXXc2AIj_avqSl0E0icqbWV3OCwJ9OKxIvnpPr5QMSAYKylYBZLVhtiJn3dvKgHATcDeZsLyJc9thJW9Q6TfA1G0mUoN6dTNUiKYxPm4XqrpF7mOzeLk443kGiakFTPonyHSnXrc6W0cLb6tBhtdayJ1haTrdAwFqqs7eTYc29wYAyXqxvl3z_dVOP6nb0ZAHhw',
    specs: [
      { label: 'Processor', value: 'Intel Core i3 / Equivalent' },
      { label: 'Memory / Disk', value: '8GB DDR4 + 512GB SSD' },
      { label: 'Screen Size', value: '15.6" FHD Anti-Glare' },
      { label: 'Operating System', value: 'Windows 11 Home pre-activated' }
    ],
    checklist: [
      'Audit reports submitted',
      '100 verified merchant listings',
      'Zero fake/invalid transactions',
      'At least 90% active QR uptime'
    ]
  },
  {
    id: 250,
    name: 'Electric Scooter',
    milestoneShops: 250,
    claimShops: 251,
    maxValue: 105000,
    description: 'Eco-friendly premium electric scooter (Ola S1 Air or equivalent EV) to commute effortlessly and efficiently across your shop network locations.',
    imgUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsKvNZesLlo1Xyydqp7caWmSRvyHR1XFMhSyftD4uIDKtY1xUA_8c4CDmNiLWgQzAttQv2NKA4jqT9sXrX8CoJD9HnvoMoBFG8BAtLsJlOuA5rN_t2ZZ3-jfOTsxXt_zzc_1tMVDsS1duG4s8kvd1IH6oTt_a_hwQF1y8Hp-wueG7brJGy0PauxM2azw81tyEgciS0rmKBWjTiTwvms6iffGTaEhk4y1_GtvfWoh_uq2xViwwHk1uw3DjQ',
    specs: [
      { label: 'True Range', value: '125 KM True Range' },
      { label: 'Charging Time', value: '4.5 Hrs Home Charging' },
      { label: 'Top Speed', value: '85 KM/Hr' },
      { label: 'Cash Alternative', value: '₹90,000 direct payout' }
    ],
    checklist: [
      '250 verified qualifying shops',
      'All merchant KYC audited',
      'No pending registration holds',
      'Active scanner compliance check'
    ]
  },
  {
    id: 500,
    name: 'Latest iPhone',
    milestoneShops: 500,
    claimShops: 501,
    maxValue: 150000,
    description: 'Flagship Apple smartphone equipped with pro-grade cinematic video cameras and ultimate processing power to run your retail network empire on the go.',
    imgUrl: undefined, // Will render custom icon beautifully
    specs: [
      { label: 'Camera Quality', value: '48MP Pro System' },
      { label: 'Processor', value: 'A-series Ultimate Bionic' },
      { label: 'Screen Tech', value: 'Super Retina XDR OLED' },
      { label: 'Storage Space', value: '128GB Standard High-Speed' }
    ],
    checklist: [
      '500 active partner shops',
      'Quarterly network audit report',
      'Annual compliant merchant index',
      'Executive compliance review'
    ]
  },
  {
    id: 750,
    name: 'Royal Enfield',
    milestoneShops: 750,
    claimShops: 751,
    maxValue: 250000,
    description: 'Cruising in style with a premium 350cc Royal Enfield motorcycle. Built for reliable long journeys and solid executive market presence.',
    imgUrl: undefined,
    specs: [
      { label: 'Engine Capacity', value: '350cc Single Cylinder' },
      { label: 'Braking System', value: 'Dual Channel ABS' },
      { label: 'Design Theme', value: 'Retro-classic design styling' },
      { label: 'On-road Cover', value: 'Standard registration + insurance' }
    ],
    checklist: [
      '750 validated shop setups',
      'Merchants active past 90 days',
      'Top tier local market coverage',
      'Anti-fraud security clearance'
    ]
  },
  {
    id: 1000,
    name: 'Brezza Contribution',
    milestoneShops: 1000,
    claimShops: 1001,
    maxValue: 750000,
    description: 'Secure ₹7,50,000 cash contribution directly towards purchasing your brand new family SUV (Maruti Suzuki Brezza).',
    imgUrl: undefined,
    specs: [
      { label: 'SUV Contribution', value: '₹7,50,000 Cash Voucher' },
      { label: 'Vehicle Target', value: 'Maruti Suzuki Brezza' },
      { label: 'Premium Class', value: 'Smart Hybrid Petrol Variant' },
      { label: 'Support System', value: 'Direct dealer tie-up voucher' }
    ],
    checklist: [
      '1000 verified qualifying shops',
      'KYC checked partner portfolio',
      'Lifetime active scan compliance',
      'National awards board sign-off'
    ]
  }
];

export default function RewardDetailsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack: () => void;
}) {
  const [qualifyingCount, setQualifyingCount] = useState<number>(247);
  const [selectedRewardId, setSelectedRewardId] = useState<number>(250);
  const [showClaimSuccess, setShowClaimSuccess] = useState<boolean>(false);
  const [claimType, setClaimType] = useState<'scooter' | 'cash' | 'welcome' | 'tablet' | 'laptop' | null>(null);

  useEffect(() => {
    // Dynamically retrieve simulated qualifying count if set in previous screen
    // We synchronize nicely using local storage
    const savedCount = localStorage.getItem('simulatedQualifyingCount');
    if (savedCount) {
      setQualifyingCount(parseInt(savedCount) || 247);
    }
  }, []);

  const activeReward = MILESTONES.find(m => m.id === selectedRewardId) || MILESTONES[3];

  // Dynamic status evaluation
  const isCompleted = qualifyingCount >= activeReward.milestoneShops;
  const isClaimUnlocked = qualifyingCount >= activeReward.claimShops;
  
  // Calculate dynamic progress for the specific selected reward
  const progressPercent = Math.min(
    100,
    Math.round((qualifyingCount / activeReward.milestoneShops) * 100)
  );

  // Requirements met count simulation
  const requirementsMetCount = useMemo(() => {
    if (qualifyingCount >= activeReward.claimShops) return 8;
    if (qualifyingCount >= activeReward.milestoneShops) return 7;
    if (activeReward.id === 250) {
      // 247 shops default
      return 5;
    }
    // Simple mock ratio for other locked items
    const ratio = qualifyingCount / activeReward.milestoneShops;
    return Math.min(7, Math.max(1, Math.floor(ratio * 8)));
  }, [qualifyingCount, activeReward]);

  const handleClaimReward = () => {
    if (!isClaimUnlocked) return;
    setClaimType(
      activeReward.id === 250 
        ? 'scooter' 
        : activeReward.id === 25 
        ? 'welcome'
        : activeReward.id === 50 
        ? 'tablet'
        : activeReward.id === 100 
        ? 'laptop'
        : 'cash'
    );
    setShowClaimSuccess(true);
  };

  const getFallbackIcon = (id: number) => {
    switch (id) {
      case 25: return <Gift className="w-12 h-12 text-[#b90064]" />;
      case 50: return <Tablet className="w-12 h-12 text-[#b90064]" />;
      case 100: return <Laptop className="w-12 h-12 text-[#b90064]" />;
      case 500: return <Smartphone className="w-12 h-12 text-[#b90064]" />;
      case 750: return <Bike className="w-12 h-12 text-[#b90064]" />;
      case 1000: return <Car className="w-12 h-12 text-amber-500" />;
      default: return <Award className="w-12 h-12 text-[#b90064]" />;
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans max-w-md mx-auto shadow-lg border-x border-gray-100">
      
      {/* Sticky Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 bg-white/85 backdrop-blur-md shadow-xs h-14 flex items-center justify-between px-4 max-w-md mx-auto border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-pink-50 text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-extrabold text-sm text-gray-900 tracking-tight">Reward Details</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => alert(`Active Qualifying Shops: ${qualifyingCount}\nYour progress is audited and updated hourly.`)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 pt-16 px-4 space-y-4">
        
        {/* Horizontal Reward Selector Chips */}
        <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar -mx-4 px-4 shrink-0">
          {MILESTONES.map((milestone) => {
            const isSelected = selectedRewardId === milestone.id;
            const isMilestoneReached = qualifyingCount >= milestone.milestoneShops;

            return (
              <button
                key={milestone.id}
                onClick={() => {
                  setSelectedRewardId(milestone.id);
                }}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#e6007e] text-white border-[#e6007e] shadow-xs'
                    : isMilestoneReached
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {isMilestoneReached && <Check size={11} className="stroke-[3px]" />}
                <span>{milestone.milestoneShops} Shops</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Active Reward Presenter */}
        <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xs overflow-hidden relative">
          
          {/* Milestone Target Highlight Ribbon */}
          {activeReward.id === 250 && (
            <div className="absolute top-4 left-4 z-20 bg-[#fde7f3] text-[#b90064] border border-[#ffb0c9]/60 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-2xs">
              <Flag size={11} className="fill-[#b90064]" />
              <span>Current Target Campaign</span>
            </div>
          )}

          {/* Reward Status Ribbon */}
          <div className="absolute top-4 right-4 z-20">
            {isClaimUnlocked ? (
              <span className="bg-emerald-500 text-white font-black text-[9px] px-2.5 py-1 rounded-full shadow-2xs uppercase tracking-wide">
                Unlocked
              </span>
            ) : isCompleted ? (
              <span className="bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-full shadow-2xs uppercase tracking-wide">
                Milestone Reached
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-400 font-bold text-[9px] px-2.5 py-1 rounded-full border border-gray-200/50 uppercase tracking-wide">
                Locked
              </span>
            )}
          </div>

          {/* Large Visual Section */}
          <div className="h-60 w-full relative bg-gray-50 flex items-center justify-center p-4">
            {activeReward.imgUrl ? (
              <img
                src={activeReward.imgUrl}
                alt={activeReward.name}
                className="max-h-full max-w-full object-contain drop-shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-20 h-20 bg-[#fde7f3] rounded-full flex items-center justify-center border border-[#ffb0c9]/50 shadow-xs">
                  {getFallbackIcon(activeReward.id)}
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium Catalogue</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
          </div>

          {/* Reward Specs Content */}
          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight">{activeReward.name}</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                Milestone: {activeReward.milestoneShops} Shops • Claim Unlock: {activeReward.claimShops} Shops
              </p>
            </div>

            {/* Description */}
            <p className="text-[11.5px] text-gray-500 leading-relaxed font-semibold">
              {activeReward.description}
            </p>

            {/* Max value card */}
            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex justify-between items-center">
              <span className="text-[11px] text-gray-500 font-bold uppercase">Estimated Reward Value</span>
              <span className="text-sm font-black text-[#b90064]">₹{activeReward.maxValue.toLocaleString()}</span>
            </div>

            {/* Progress metrics */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress toward reward</span>
                <span className="text-xs font-black text-[#b90064]">
                  {qualifyingCount} / {activeReward.milestoneShops} shops
                </span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-gray-100">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-[#e6007e]'
                  }`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="text-[10.5px] text-gray-500 leading-normal font-medium bg-pink-50/30 p-3 rounded-2xl border border-pink-100/50">
                {isClaimUnlocked ? (
                  <span className="text-emerald-700 font-bold">
                    🎉 Excellent! You have verified {qualifyingCount} shops. Tap Claim Reward below to process delivery options.
                  </span>
                ) : isCompleted ? (
                  <span>
                    🏆 Milestone completed! Reach <span className="font-bold text-gray-800">{activeReward.claimShops} verified qualifying shops</span> (just {activeReward.claimShops - qualifyingCount} more!) to fully unlock the claim button.
                  </span>
                ) : (
                  <span>
                    Complete <span className="font-bold text-gray-800">{activeReward.milestoneShops} qualifying shops</span> to hit this milestone. The claim system activates after {activeReward.claimShops} verified shops.
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Interactive Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={() => onNavigate('shops')}
            className="flex-1 bg-[#fde7f3] text-[#b90064] border border-[#ffb0c9]/60 font-bold h-12 rounded-2xl text-xs transition-all active:scale-95 cursor-pointer text-center"
          >
            Verify Outlets List
          </button>
          
          <button
            onClick={handleClaimReward}
            disabled={!isClaimUnlocked}
            className={`flex-1 font-bold h-12 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 ${
              isClaimUnlocked
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 cursor-pointer animate-pulse'
                : 'bg-gray-100 text-gray-400 border border-gray-200/60 cursor-not-allowed opacity-75'
            }`}
          >
            <Gift size={14} />
            <span>Claim Reward</span>
          </button>
        </div>

        {/* Grid of Eligibility Checklist & Specifications */}
        <div className="space-y-4 pt-1">
          
          {/* Eligibility checklist block */}
          <section className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-amber-500" /> Eligibility Audit Checklist
              </h3>
              <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {requirementsMetCount} of 8 Clear
              </span>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {activeReward.checklist.map((item, idx) => {
                const checked = idx < requirementsMetCount;
                return (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      checked ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Check size={11} className="stroke-[3px]" />
                    </div>
                    <span className={`font-semibold ${checked ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                      {item}
                    </span>
                  </div>
                );
              })}
              <div className="flex gap-2.5 items-start">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  qualifyingCount >= activeReward.milestoneShops ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Check size={11} className="stroke-[3px]" />
                </div>
                <span className={`font-semibold ${qualifyingCount >= activeReward.milestoneShops ? 'text-gray-700' : 'text-gray-400'}`}>
                  Target Milestone count achieved ({qualifyingCount} / {activeReward.milestoneShops})
                </span>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  qualifyingCount >= activeReward.claimShops ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Check size={11} className="stroke-[3px]" />
                </div>
                <span className={`font-semibold ${qualifyingCount >= activeReward.claimShops ? 'text-gray-700' : 'text-gray-400'}`}>
                  Target Claim Buffer achieved ({qualifyingCount} / {activeReward.claimShops})
                </span>
              </div>
            </div>
          </section>

          {/* Specifications details block */}
          <section className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} className="text-[#b90064]" /> Reward Specifications
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {activeReward.specs.map((spec, idx) => (
                <div key={idx} className="bg-gray-50/80 p-2.5 rounded-2xl border border-gray-100 flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{spec.label}</span>
                  <span className="font-extrabold text-gray-800 leading-tight">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Campaign terms & rules banner */}
          <section className="bg-gray-50 rounded-3xl p-5 border border-gray-200/50 space-y-2">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-gray-500" /> Rules &amp; Policies
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
              All rewards are subject to a mandatory 72-hour fraud review audit upon claim selection. Value calculations are based on standard base models and direct dealer vouchers. Prizes are strictly non-transferable.
            </p>
          </section>

        </div>

        {/* Complete Catalogue Timeline List */}
        <section className="space-y-3.5 pt-2">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">
            Complete Rewards Catalogue
          </h3>

          <div className="space-y-2.5">
            {MILESTONES.map((item) => {
              const itemCompleted = qualifyingCount >= item.milestoneShops;
              const isSelected = selectedRewardId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRewardId(item.id)}
                  className={`bg-white p-3 rounded-2xl border flex items-center gap-3.5 hover:shadow-xs transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#e6007e] ring-1 ring-[#e6007e]/30' 
                      : 'border-gray-200/50'
                  }`}
                >
                  {/* Miniature Image / Icon Container */}
                  <div className="w-12 h-12 rounded-xl bg-gray-50/80 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.imgUrl ? (
                      <img 
                        alt={item.name} 
                        className="object-contain w-10 h-10" 
                        src={item.imgUrl} 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="scale-75">
                        {getFallbackIcon(item.id)}
                      </div>
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold block mt-0.5">Milestone: {item.milestoneShops} Shops</p>
                  </div>

                  {/* Status Pills */}
                  <div className="shrink-0 ml-2">
                    {itemCompleted ? (
                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                        <Check size={10} className="stroke-[3px]" /> Reached
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase">
                        <Lock size={9} /> Locked
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Max Cumulative Value Gold Banner */}
        <section className="bg-gray-900 rounded-3xl p-5 text-center relative overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none"></div>
          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block mb-1">
            Nexora Premium VIP Rewards
          </span>
          <h3 className="text-lg font-black text-white">Maximum Cumulative Value</h3>
          <div className="text-xl font-black text-amber-400 mt-1">Up to ₹12,50,000</div>
          <p className="text-[10.5px] text-gray-400 leading-normal font-semibold max-w-xs mx-auto mt-2">
            Inclusive of all milestones from Welcome Kits to premium family SUV contributions. Keep expanding your shop referral network!
          </p>
        </section>

      </main>

      {/* Claim Success Popup Overlay Modal */}
      <AnimatePresence>
        {showClaimSuccess && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowClaimSuccess(false)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 text-center p-6 space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-md animate-bounce">
                🎉
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900 tracking-tight">Claim Selection Registered!</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                  Verified Payout Initiated
                </p>
              </div>

              <p className="text-xs text-gray-600 leading-normal font-semibold">
                Congratulations Rajesh! Your claim request for the <span className="text-[#b90064] font-black">{activeReward.name}</span> valued at <span className="font-bold">₹{activeReward.maxValue.toLocaleString()}</span> has been securely submitted.
              </p>

              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-left text-xs space-y-1 text-gray-500">
                <p><strong>Claim ID:</strong> CLM-{Date.now().toString().slice(-6)}</p>
                <p><strong>Method:</strong> Standard KYC direct allotment</p>
                <p><strong>Status:</strong> Processing (Subject to 72-hr security audit review)</p>
              </div>

              <p className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                ⚠️ Make sure your bank account details &amp; PAN card documents are fully updated in the profile tab.
              </p>

              <button
                onClick={() => setShowClaimSuccess(false)}
                className="w-full bg-[#e6007e] text-white py-3 rounded-2xl text-xs font-black shadow-xs hover:bg-pink-700 active:scale-98 transition-all cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      <BottomNav onNavigate={onNavigate} currentPage="rewards" />

    </div>
  );
}
