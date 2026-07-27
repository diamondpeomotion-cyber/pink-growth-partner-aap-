import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Bell,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  Plus,
  ChevronRight,
  Info,
  Calendar,
  DollarSign,
  QrCode,
  X,
  MapPin,
  Check,
  User,
  ExternalLink,
  Smartphone,
  Sparkles,
  RefreshCw,
  Phone
} from 'lucide-react';
import BottomNav from './BottomNav';

interface Shop {
  id: string;
  name: string;
  code: string;
  status: 'Passed' | 'Daily Target Failed' | 'Qualifying' | 'QR Not Active' | 'Need Changes' | 'Under Review' | 'KYC Pending' | 'Draft' | 'Rejected' | '15-Day Cycle';
  displayStatus: string;
  type: string;
  progress?: {
    current: number;
    total: number;
    label: string;
    statusLabel: string;
    percentage: number;
  };
  issueDescription?: string;
  issueType?: string;
  submittedDate?: string;
  area: string;
  ownerName: string;
  mobile: string;
  earnings?: number;
}

const INITIAL_SHOPS: Shop[] = [
  {
    id: '1',
    name: 'Glow Beauty Parlour',
    code: 'NX-SHOP-0247',
    status: '15-Day Cycle',
    displayStatus: 'Passed',
    type: '15-Day Cycle',
    progress: {
      current: 9,
      total: 15,
      label: 'Day 9 of 15',
      statusLabel: 'On Track',
      percentage: 60
    },
    area: 'MI Road',
    ownerName: 'Sunita Sharma',
    mobile: '98765 12345',
    earnings: 4500
  },
  {
    id: '2',
    name: 'Royal Cut Salon',
    code: 'NX-SHOP-0248',
    status: 'Daily Target Failed',
    displayStatus: 'Failed',
    type: 'Daily Target Failed',
    issueDescription: 'Transaction: ₹800 - Today’s minimum ₹1,000 QR target was not completed.',
    issueType: 'low_transaction',
    area: 'Mansarovar',
    ownerName: 'Rajesh Sharma',
    mobile: '98290 87654',
    earnings: 12000
  },
  {
    id: '3',
    name: 'Urban Spa',
    code: 'NX-SHOP-0225',
    status: 'Qualifying',
    displayStatus: 'Qualifying',
    type: 'Qualifying',
    issueDescription: '15-Day Cycle: Completed successfully.',
    area: 'C-Scheme',
    ownerName: 'Amit Verma',
    mobile: '98112 34567',
    earnings: 15000
  },
  {
    id: '4',
    name: 'Style Studio',
    code: 'NX-SHOP-0265',
    status: 'QR Not Active',
    displayStatus: 'Inactive',
    type: 'QR Not Active',
    issueDescription: 'QR qualification will start after Nexora QR activation by the merchant.',
    area: 'Malviya Nagar',
    ownerName: 'Pooja Gupta',
    mobile: '98555 12121',
    earnings: 0
  },
  {
    id: '5',
    name: 'The Nail Room',
    code: 'NX-SHOP-0269',
    status: 'Need Changes',
    displayStatus: 'Needs Fix',
    type: 'Need Changes',
    issueDescription: 'Shop front photo is unclear. Please re-upload a clear image.',
    issueType: 'unclear_photo',
    area: 'Vaishali Nagar',
    ownerName: 'Kiran Kapoor',
    mobile: '98111 22233',
    earnings: 0
  },
  {
    id: '6',
    name: 'Jaipur Tattoo Studio',
    code: 'NX-SHOP-0271',
    status: 'Under Review',
    displayStatus: 'Reviewing',
    type: 'Under Review',
    submittedDate: '26 Jul 2026',
    area: 'Raja Park',
    ownerName: 'Kunal Singh',
    mobile: '99887 76655',
    earnings: 0
  },
  {
    id: '7',
    name: 'Shear Genius Salon',
    code: 'NX-SHOP-0272',
    status: 'KYC Pending',
    displayStatus: 'KYC Pending',
    type: 'KYC Pending',
    area: 'MI Road',
    ownerName: 'Anil Kumar',
    mobile: '97865 43210',
    earnings: 0
  },
  {
    id: '8',
    name: 'Pink City Spa',
    code: 'NX-SHOP-0273',
    status: 'Draft',
    displayStatus: 'Draft',
    type: 'Draft',
    area: 'Mansarovar',
    ownerName: 'Sanjay Dutta',
    mobile: '94140 12345',
    earnings: 0
  },
  {
    id: '9',
    name: 'Elite Gents Salon',
    code: 'NX-SHOP-0274',
    status: 'Rejected',
    displayStatus: 'Rejected',
    type: 'Rejected',
    area: 'Sodala',
    ownerName: 'Harish Meena',
    mobile: '94140 54321',
    earnings: 0
  }
];

export default function MyShopsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const [selectedArea, setSelectedArea] = useState('');
  
  // Interactive Modal States
  const [activeModal, setActiveModal] = useState<{
    type: 'progress' | 'issue' | 'qr' | 'status' | 'notifications';
    shop?: Shop;
  } | null>(null);

  // Tab configurations
  const tabs = [
    { label: 'All', count: 270, value: 'All' },
    { label: 'Qualifying', count: 247, value: 'Qualifying' },
    { label: 'Under Review', count: 4, value: 'Under Review' },
    { label: 'Need Changes', count: 2, value: 'Need Changes' },
    { label: 'KYC Pending', count: 4, value: 'KYC Pending' },
    { label: 'QR Not Active', count: 3, value: 'QR Not Active' },
    { label: '15-Day Cycle', count: 3, value: '15-Day Cycle' },
    { label: 'Daily Target Failed', count: 2, value: 'Daily Target Failed' },
    { label: 'Draft', count: 5, value: 'Draft' },
    { label: 'Rejected', count: 5, value: 'Rejected' }
  ];

  // Filtering & Sorting Logic
  const filteredShops = useMemo(() => {
    let result = [...shops];

    // Filter by Tab
    if (activeTab !== 'All') {
      result = result.filter(shop => shop.status === activeTab);
    }

    // Filter by Area (from Filter Bottom Sheet)
    if (selectedArea) {
      result = result.filter(shop => shop.area.toLowerCase().includes(selectedArea.toLowerCase()));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        shop =>
          shop.name.toLowerCase().includes(q) ||
          shop.code.toLowerCase().includes(q) ||
          shop.ownerName.toLowerCase().includes(q) ||
          shop.mobile.includes(q) ||
          shop.area.toLowerCase().includes(q)
      );
    }

    // Sort
    if (selectedSort === 'Newest First') {
      result.sort((a, b) => b.code.localeCompare(a.code));
    } else if (selectedSort === 'Oldest First') {
      result.sort((a, b) => a.code.localeCompare(b.code));
    } else if (selectedSort === 'Highest Earnings') {
      result.sort((a, b) => (b.earnings || 0) - (a.earnings || 0));
    }

    return result;
  }, [shops, activeTab, selectedArea, searchQuery, selectedSort]);

  // Handle Bottom Sheet filters apply
  const handleApplyFilters = () => {
    setFilterSheetOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedSort('Newest First');
    setSelectedArea('');
    setActiveTab('All');
    setFilterSheetOpen(false);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative pb-24 font-sans">
      
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-xs h-16 flex justify-between items-center px-4 max-w-lg mx-auto border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#b90064] hover:bg-pink-50 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold text-primary tracking-tight">Nexora Growth</h1>
            <span className="text-[10px] text-gray-400 font-semibold uppercase">GP-JPR-1024</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            aria-label="Search hint"
            onClick={() => {
              const input = document.getElementById('search-input');
              input?.focus();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Search size={18} />
          </button>
          <button 
            aria-label="Filter panel"
            onClick={() => setFilterSheetOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all relative"
          >
            <SlidersHorizontal size={18} />
            {(selectedArea || selectedSort !== 'Newest First') && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
          <button 
            aria-label="Notifications"
            onClick={() => onNavigate('notifications')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b90064] rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-16 px-4">
        
        {/* Title */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">My Shops</h2>
          <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Verified
          </span>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Onboarded</span>
            <span className="text-2xl font-black text-gray-900 mt-1">270</span>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Verified Shops</span>
            <span className="text-2xl font-black text-emerald-600 mt-1">250</span>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qualifying</span>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-2xl font-black text-primary">247</span>
              <Star size={14} className="text-primary fill-primary mb-1.5 shrink-0" />
            </div>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Need Action</span>
            <span className="text-2xl font-black text-red-500 mt-1 ml-1">11</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mb-5 text-center font-medium opacity-80">
          Only qualifying shops are counted towards rewards.
        </p>

        {/* Search Field */}
        <div className="relative mb-5">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-11 pr-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-medium text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-inner"
            placeholder="Search shop, owner, mobile or area..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-200/50 p-1 rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 -mx-4 px-4 snap-x">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`snap-start flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs border whitespace-nowrap active:scale-95 transition-all shadow-xs ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Shop Cards List */}
        <div className="flex flex-col gap-4">
          {filteredShops.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-xs flex flex-col items-center">
              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-3">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Shops Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">No onboarded shops match your search parameters. Try adjusting filters.</p>
              <button 
                onClick={handleClearFilters}
                className="mt-4 text-xs font-bold text-primary bg-pink-50 px-4 py-2 rounded-xl hover:bg-pink-100 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredShops.map((shop) => {
              // Decide border and accent coloring based on status
              let accentColor = 'bg-emerald-500';
              let borderStyle = 'border-gray-200';
              let tagStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              
              if (shop.status === 'Daily Target Failed' || shop.status === 'Rejected') {
                accentColor = 'bg-red-500';
                borderStyle = 'border-red-100';
                tagStyle = 'bg-red-50 text-red-600 border-red-100';
              } else if (shop.status === 'QR Not Active') {
                accentColor = 'bg-amber-500';
                borderStyle = 'border-amber-100';
                tagStyle = 'bg-amber-50 text-amber-700 border-amber-100';
              } else if (shop.status === 'Need Changes') {
                accentColor = 'bg-red-400';
                borderStyle = 'border-red-200';
                tagStyle = 'bg-rose-50 text-rose-700 border-rose-100';
              } else if (shop.status === 'Under Review') {
                accentColor = 'bg-blue-500';
                borderStyle = 'border-blue-100';
                tagStyle = 'bg-blue-50 text-blue-700 border-blue-100';
              } else if (shop.status === 'KYC Pending') {
                accentColor = 'bg-amber-400';
                borderStyle = 'border-amber-100';
                tagStyle = 'bg-amber-50 text-amber-800 border-amber-100';
              } else if (shop.status === 'Qualifying') {
                accentColor = 'bg-primary';
                borderStyle = 'border-pink-100';
                tagStyle = 'bg-pink-50 text-primary border-pink-100';
              }

              return (
                <div
                  key={shop.id}
                  className={`bg-white rounded-3xl p-4 shadow-sm border ${borderStyle} relative overflow-hidden hover:shadow-md transition-all`}
                >
                  {/* Status Strip Accent */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>

                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3 ml-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm tracking-tight">{shop.name}</h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tagStyle}`}>
                          {shop.displayStatus}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 block tracking-wider">
                        {shop.code} • {shop.area}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shrink-0">
                      {shop.type}
                    </span>
                  </div>

                  {/* Progress Block (15-Day Cycle) */}
                  {shop.progress && (
                    <div className="mb-4 bg-gray-50/60 border border-gray-100/50 rounded-2xl p-3 ml-2">
                      <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                        <span className="text-gray-500">{shop.progress.label}</span>
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 size={11} /> {shop.progress.statusLabel}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${shop.progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Issue Box (Failed / Need Changes) */}
                  {shop.issueDescription && !shop.progress && (
                    <div className="bg-red-50/50 rounded-2xl p-3 mb-4 border border-red-100/80 ml-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-bold text-red-600 capitalize">
                            {shop.status === 'Daily Target Failed' ? 'Target Failed' : 'Action Required'}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed font-medium">
                            {shop.issueDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Box */}
                  {shop.status === 'Under Review' && (
                    <div className="mb-4 flex items-center gap-2 text-gray-500 ml-2 text-xs font-semibold">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Submitted: <strong className="text-gray-900">{shop.submittedDate}</strong></span>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex gap-2 ml-2 mt-2">
                    {shop.status === '15-Day Cycle' && (
                      <button
                        onClick={() => onNavigate('shop-qualification')}
                        className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <SlidersHorizontal size={14} /> View Progress
                      </button>
                    )}

                    {shop.status === 'Daily Target Failed' && (
                      <button
                        onClick={() => setActiveModal({ type: 'issue', shop })}
                        className="flex-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all cursor-pointer"
                      >
                        View Issue
                      </button>
                    )}

                    {shop.status === 'Qualifying' && (
                      <>
                        <button
                          onClick={() => alert(`Showing Earnings for ${shop.name}: ₹${shop.earnings}`)}
                          className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <DollarSign size={13} /> View Earnings
                        </button>
                        <button
                          onClick={() => alert(`Showing details for ${shop.name}`)}
                          className="flex-1 bg-primary text-white h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center cursor-pointer"
                        >
                          View Details
                        </button>
                      </>
                    )}

                    {shop.status === 'QR Not Active' && (
                      <button
                        onClick={() => setActiveModal({ type: 'qr', shop })}
                        className="flex-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <QrCode size={14} /> View QR Status
                      </button>
                    )}

                    {shop.status === 'Need Changes' && (
                      <button
                        onClick={() => onNavigate('add-shop')}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center cursor-pointer"
                      >
                        Fix Now
                      </button>
                    )}

                    {shop.status === 'Under Review' && (
                      <button
                        onClick={() => setActiveModal({ type: 'status', shop })}
                        className="flex-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all cursor-pointer"
                      >
                        Track Status
                      </button>
                    )}

                    {shop.status === 'KYC Pending' && (
                      <button
                        onClick={() => alert(`Redirecting to KYC verification for ${shop.name}`)}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all flex items-center justify-center cursor-pointer"
                      >
                        Complete KYC
                      </button>
                    )}

                    {shop.status === 'Draft' && (
                      <button
                        onClick={() => onNavigate('add-shop')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all cursor-pointer"
                      >
                        Continue Draft
                      </button>
                    )}

                    {shop.status === 'Rejected' && (
                      <button
                        onClick={() => alert(`View rejection details: Non-operational shop address.`)}
                        className="flex-1 bg-red-50 text-red-600 h-10 rounded-2xl font-bold text-xs active:scale-98 transition-all cursor-pointer"
                      >
                        View Reason
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Action Button "Add Shop" */}
      <button
        onClick={() => onNavigate('add-shop')}
        className="fixed right-5 bottom-24 bg-primary text-white rounded-2xl h-14 px-5 shadow-lg flex items-center justify-center gap-2 z-40 active:scale-95 hover:scale-102 transition-all cursor-pointer"
      >
        <Plus size={20} className="stroke-[3px]" />
        <span className="text-xs font-extrabold tracking-tight">Add Shop</span>
      </button>

      {/* Bottom Navigation */}
      <BottomNav onNavigate={onNavigate} currentPage="shops" />

      {/* ================= FILTER BOTTOM SHEET OVERLAY ================= */}
      {filterSheetOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setFilterSheetOpen(false)}
          ></div>

          {/* Sheet Content */}
          <div className="relative w-full max-w-lg bg-white rounded-t-[24px] shadow-2xl transition-all duration-300 max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom">
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-5 pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900">Filter & Sort Shops</h3>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="text-gray-400 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {/* Sort By Option */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2.5">Sort By</h4>
                <div className="grid grid-cols-3 gap-2">
                  {['Newest First', 'Oldest First', 'Highest Earnings'].map((sortOpt) => (
                    <button
                      key={sortOpt}
                      onClick={() => setSelectedSort(sortOpt)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all text-center ${
                        selectedSort === sortOpt
                          ? 'bg-primary/5 text-primary border-primary/30'
                          : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100/50'
                      }`}
                    >
                      {sortOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Location Filter */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2.5">Filter by Area</h4>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:ring-1 focus:ring-primary/20 outline-none"
                    placeholder="Enter area (e.g. MI Road, Mansarovar)..."
                  />
                  {selectedArea && (
                    <button
                      onClick={() => setSelectedArea('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Quick Select */}
              <div>
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2.5">Quick Status Filter</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Qualifying', '15-Day Cycle', 'Daily Target Failed', 'QR Not Active', 'Need Changes', 'Under Review'].map((statusOpt) => (
                    <button
                      key={statusOpt}
                      onClick={() => setActiveTab(statusOpt)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        activeTab === statusOpt
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {statusOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white pb-6">
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 h-11 rounded-2xl font-bold text-xs transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-[2] bg-primary text-white h-11 rounded-2xl font-bold text-xs shadow-md shadow-pink-600/10 hover:bg-primary/95 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE DETAIL MODALS ================= */}
      {activeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setActiveModal(null)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-extrabold text-xs text-gray-900 capitalize">
                  {activeModal.type === 'progress' && '15-Day Onboarding Progress'}
                  {activeModal.type === 'issue' && 'Resolve Target Deficit'}
                  {activeModal.type === 'qr' && 'QR Code Deployment'}
                  {activeModal.type === 'status' && 'Verification Timeline'}
                  {activeModal.type === 'notifications' && 'Partner Alerts'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              
              {/* 1. Progress Modal */}
              {activeModal.type === 'progress' && activeModal.shop && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <p className="text-sm font-black text-gray-900">{activeModal.shop.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{activeModal.shop.code}</p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-800">15-Day Progress Target</p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">₹1,000 daily transaction target</p>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded-lg">
                      Day 9/15
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Daily Transaction Logs</p>
                    {[
                      { day: 'Day 9 (Today)', amt: '₹1,240', status: 'Passed' },
                      { day: 'Day 8 (Yesterday)', amt: '₹1,850', status: 'Passed' },
                      { day: 'Day 7', amt: '₹1,020', status: 'Passed' },
                      { day: 'Day 6', amt: '₹1,500', status: 'Passed' },
                      { day: 'Day 5', amt: '₹1,110', status: 'Passed' },
                      { day: 'Day 4', amt: '₹1,430', status: 'Passed' },
                      { day: 'Day 3', amt: '₹1,200', status: 'Passed' },
                      { day: 'Day 2', amt: '₹1,050', status: 'Passed' },
                      { day: 'Day 1', amt: '₹1,320', status: 'Passed' }
                    ].map((log, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-700">{log.day}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900">{log.amt}</span>
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center">
                            <Check size={9} className="mr-0.5" /> Passed
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Issue Modal */}
              {activeModal.type === 'issue' && activeModal.shop && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="font-black text-sm text-gray-900">{activeModal.shop.name}</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    The merchant's daily transaction volume fell below the minimum qualifying threshold of ₹1,000 today.
                  </p>

                  <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-semibold">Today's Transactions</span>
                      <span className="font-black text-red-600">₹800</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-semibold">Minimum Target Required</span>
                      <span className="font-black text-gray-900">₹1,000</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-gray-100 pt-2 text-red-600 font-bold">
                      <span>Deficit Gap</span>
                      <span>- ₹200</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                      💡 <strong>How to resolve:</strong> Contact the merchant at <strong>+91 {activeModal.shop.mobile}</strong> and prompt them to route another transaction before midnight to satisfy the daily requirement.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => alert(`Calling ${activeModal.shop?.ownerName} at ${activeModal.shop?.mobile}`)}
                      className="flex-1 bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Phone size={14} /> Call Merchant
                    </button>
                    <button
                      onClick={() => alert(`WhatsApp prompt template copied`)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 h-11 rounded-xl text-xs font-bold active:scale-95 transition-all"
                    >
                      Send WA Alert
                    </button>
                  </div>
                </div>
              )}

              {/* 3. QR Modal */}
              {activeModal.type === 'qr' && activeModal.shop && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <QrCode size={24} />
                  </div>
                  <h4 className="font-black text-sm text-gray-900">{activeModal.shop.name}</h4>
                  <p className="text-xs text-gray-500">
                    The Nexora QR code needs to be verified and activated at the retail location.
                  </p>

                  <div className="space-y-3 text-left">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Deployment Checklist</p>
                    <div className="space-y-2">
                      {[
                        { step: '1. Sticker QR Deployed', completed: true },
                        { step: '2. Merchant Mobile Linked', completed: true },
                        { step: '3. First Test Payment Done', completed: false },
                        { step: '4. Physical Signage Placed', completed: false }
                      ].map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          {chk.completed ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                          ) : (
                            <Clock size={14} className="text-gray-300" />
                          )}
                          <span className={chk.completed ? 'text-gray-900 font-bold' : 'text-gray-400'}>{chk.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Starting QR Activation walkthrough')}
                    className="w-full bg-primary text-white h-11 rounded-xl text-xs font-bold active:scale-95 transition-all mt-2"
                  >
                    Scan QR & Activate Now
                  </button>
                </div>
              )}

              {/* 4. Verification Timeline Modal */}
              {activeModal.type === 'status' && activeModal.shop && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <p className="text-sm font-black text-gray-900">{activeModal.shop.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{activeModal.shop.code}</p>
                  </div>

                  <div className="space-y-4 relative pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                    {[
                      { title: 'Onboarding Application Submitted', desc: 'Awaiting field supervisor audit', date: '26 Jul 2026', done: true, active: true },
                      { title: 'Document & KYC Verification', desc: 'Aadhaar, PAN, & Trade License checked', date: '26 Jul 2026', done: true },
                      { title: 'Field Physical Audit', desc: 'Shop front & signage physical validation', date: 'Pending', done: false },
                      { title: 'Onboarding Approval', desc: 'Nexora Merchant Profile activation', date: 'Pending', done: false }
                    ].map((step, idx) => (
                      <div key={idx} className="relative text-xs">
                        {step.done ? (
                          <div className={`absolute -left-[17px] top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${step.active ? 'bg-primary' : 'bg-emerald-500'}`}>
                            <Check size={9} />
                          </div>
                        ) : (
                          <div className="absolute -left-[17px] top-0.5 w-3.5 h-3.5 rounded-full bg-gray-100 border-2 border-gray-200"></div>
                        )}
                        <p className={`font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{step.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Notifications Modal */}
              {activeModal.type === 'notifications' && (
                <div className="space-y-3">
                  {[
                    { title: 'Daily Limit Reached', desc: '3 new qualifying shops verified today in Jaipur territory!', time: '10 mins ago', urgent: false },
                    { title: 'Action Required', desc: 'Royal Cut Salon requires transaction backup before midnight.', time: '1 hour ago', urgent: true },
                    { title: 'Onboarding Succeeded', desc: 'Glow Beauty Parlour has finished Day 9 target.', time: '3 hours ago', urgent: false }
                  ].map((notif, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl border text-xs relative ${
                      notif.urgent 
                        ? 'bg-red-50/50 border-red-100' 
                        : 'bg-gray-50 border-gray-100'
                    }`}>
                      {notif.urgent && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                      <p className="font-bold text-gray-900 pr-4">{notif.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{notif.desc}</p>
                      <span className="text-[9px] text-gray-400 font-bold mt-2 block uppercase">{notif.time}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
