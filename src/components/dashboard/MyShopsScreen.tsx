import React, { useState, useMemo, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  SlidersHorizontal,
  Archive,
  Bell,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Plus,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  QrCode,
  X,
  Check,
  Sparkles,
  RefreshCw,
  Phone,
  Trash2,
  Download,
  Tag,
  CheckSquare,
  Square,
  Store,
  SearchX
} from 'lucide-react';
import BottomNav from './BottomNav';
import { supabase } from '../../lib/supabaseClient';
import { resolveGrowthPartner, fetchMyAttributions } from '../../lib/gpRepository';
import { useAccurateLocation } from '../../hooks/useAccurateLocation';
import { haversineMeters, formatDistance } from '../../utils/geo';

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
  latitude?: number | null;
  longitude?: number | null;
  /** Haversine distance from the user's accepted GPS fix (set when locked). */
  distanceM?: number | null;
  ownerName: string;
  mobile: string;
  earnings?: number;
}



export default function MyShopsScreen({
  onNavigate,
  onBack
}: {
  onNavigate: (page: string) => void;
  onBack?: () => void;
}) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleTabsScroll = () => {
    if (tabsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = 200;
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleTabsScroll);
      handleTabsScroll();
      window.addEventListener('resize', handleTabsScroll);
      return () => {
        el.removeEventListener('scroll', handleTabsScroll);
        window.removeEventListener('resize', handleTabsScroll);
      };
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Live data: shops attributed to this partner from the shared project.
    const loadData = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const partner = await resolveGrowthPartner(supabase, user.id);
        if (!partner) { setShops([]); return; }
        const rows = await fetchMyAttributions(supabase, String(partner.id));
        setShops(rows.map((a) => ({
          id: String(a.id),
          name: a.salon_name ?? 'Shop',
          code: a.salon_name ?? '',
          status: (a.status === 'active' ? 'Passed' : 'Under Review') as Shop['status'],
          displayStatus: String(a.status),
          type: 'Salon',
          area: a.salon_area ?? '',
          latitude: a.salon_latitude ?? null,
          longitude: a.salon_longitude ?? null,
          ownerName: '',
          mobile: '',
          earnings: 0,
        })));
      } catch (err) {
        console.warn('My shops load failed:', err);
        setShops([]);
      } finally {
        setShopsLoading(false);
      }
    };
    void loadData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('Newest First');
  const handleArchive = (id: string) => {
    setShops(prev => prev.filter(s => s.id !== id));
  };
  const [selectedArea, setSelectedArea] = useState('');
  
  // Bulk Selection States
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Interactive Modal States
  const [activeModal, setActiveModal] = useState<{
    type: 'progress' | 'issue' | 'qr' | 'status' | 'notifications';
    shop?: Shop;
  } | null>(null);

  const tabs = useMemo(() => {
    const countFor = (value: string) =>
      value === 'All' ? shops.length : shops.filter((s) => s.status === value).length;
    return [
      { label: 'All', value: 'All' },
      { label: 'Passed', value: 'Passed' },
      { label: 'Under Review', value: 'Under Review' },
      { label: 'Need Changes', value: 'Need Changes' },
      { label: 'KYC Pending', value: 'KYC Pending' },
      { label: 'QR Not Active', value: 'QR Not Active' },
      { label: 'Draft', value: 'Draft' },
      { label: 'Rejected', value: 'Rejected' },
    ].map((t) => ({ ...t, count: countFor(t.value) }));
  }, [shops]);

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
          (shop.id && shop.id.toLowerCase().includes(q)) ||
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

  // ---- Accurate location → nearest-first sort (requirements #8–#11) --------
  // watchPosition with enableHighAccuracy; fix accepted only at <=30 m; the
  // list re-sorts only when the user moves >100 m (engine handles both).
  const geo = useAccurateLocation();
  useEffect(() => {
    geo.start();
    return () => geo.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleShops = useMemo(() => {
    if (!geo.fix) return filteredShops;
    const origin = { latitude: geo.fix.latitude, longitude: geo.fix.longitude };
    return [...filteredShops]
      .map((s) =>
        s.latitude != null && s.longitude != null
          ? { ...s, distanceM: haversineMeters(origin, { latitude: s.latitude, longitude: s.longitude }) }
          : { ...s, distanceM: null },
      )
      .sort((a, b) => (a.distanceM ?? Number.POSITIVE_INFINITY) - (b.distanceM ?? Number.POSITIVE_INFINITY));
  }, [filteredShops, geo.fix]);

  // Handle Bottom Sheet filters apply
  const handleApplyFilters = () => {
    setFilterDropdownOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedSort('Newest First');
    setSelectedArea('');
    setActiveTab('All');
    setFilterDropdownOpen(false);
  };

  // Bulk Selection Handlers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredShops.length === 0) return false;
    return filteredShops.every(s => selectedShopIds.includes(s.id));
  }, [filteredShops, selectedShopIds]);

  const toggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIdsSet = new Set(filteredShops.map(s => s.id));
      setSelectedShopIds(prev => prev.filter(id => !filteredIdsSet.has(id)));
    } else {
      const allFilteredIds = filteredShops.map(s => s.id);
      setSelectedShopIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const toggleSelectShop = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedShopIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
    setToastMsg('Shops cannot be deleted from this app. Attribution is owned by the server.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExportCSV = () => {
    const shopsToExport = shops.filter(s => selectedShopIds.includes(s.id));
    if (shopsToExport.length === 0) return;

    const headers = ['Shop ID', 'Shop Code', 'Shop Name', 'Owner Name', 'Mobile', 'Area', 'Status', 'Earnings (₹)'];
    const rows = shopsToExport.map(s => [
      `"${s.id}"`,
      `"${s.code}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.ownerName.replace(/"/g, '""')}"`,
      `"${s.mobile}"`,
      `"${s.area.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      s.earnings || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nexora_Bulk_Shops_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMsg(`Exported ${shopsToExport.length} shop(s) to CSV successfully.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleBulkStatusUpdate = (_newStatus: Shop['status']) => {
    setShowBulkStatusModal(false);
    setToastMsg('Shop status is owned by shop_attributions on the server and cannot be changed from this list.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100 overflow-x-hidden">
      
      {/* Top Header */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[var(--page-margin)] h-16">
          <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#b90064] hover:bg-pink-50 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold text-primary tracking-tight">Nexora Growth</h1>
            <span className="text-[10px] text-gray-400 font-semibold uppercase">{shops.length} attributed</span>
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
            aria-label="Notifications"
            onClick={() => onNavigate('notifications')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-all relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#b90064] rounded-full"></span>
          </button>
        </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto pt-4 pb-16 px-[var(--page-margin)]">
        
        {/* Toast Notification Banner */}
        {toastMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-emerald-600 hover:text-emerald-900 p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Title & Quick Stats */}
        <div className="flex items-center justify-between mb-3 mt-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">My Shops</h2>
          <span className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Verified
          </span>
        </div>

        {/* Top Search Bar */}
        <div className="mb-4">
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-10 bg-white rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-xs"
                placeholder="Search by shop name, shop ID (e.g., RJ-JPR-001), owner..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`h-12 w-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                  filterDropdownOpen 
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="Sort & Filter"
              >
                <SlidersHorizontal size={18} />
                {(activeTab !== 'All' || selectedSort !== 'Newest First') && !filterDropdownOpen && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {filterDropdownOpen && (
                <div className="absolute right-0 top-14 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-gray-900">Sort & Filter</h3>
                    <button onClick={handleClearFilters} className="text-[10px] font-bold text-primary hover:underline cursor-pointer">Clear All</button>
                  </div>
                  
                  <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Sort By</h4>
                      <div className="flex flex-col gap-1">
                        {['Newest First', 'Oldest First', 'Highest Earnings'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setSelectedSort(opt); setFilterDropdownOpen(false); }}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedSort === opt ? 'bg-pink-50 text-primary' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Status</h4>
                      <div className="flex flex-col gap-1">
                        {['All', 'Qualifying', 'Under Review', 'Need Changes', 'KYC Pending', 'QR Not Active', 'Daily Target Failed'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setActiveTab(opt); setFilterDropdownOpen(false); }}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${
                              activeTab === opt ? 'bg-pink-50 text-primary' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{opt === 'Qualifying' ? 'Active (Qualifying)' : opt === 'Under Review' ? 'Pending (Under Review)' : opt}</span>
                            {activeTab === opt && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {searchQuery && (
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 font-medium px-1">
              <span>
                Found <strong className="text-gray-900">{filteredShops.length}</strong> shop{filteredShops.length === 1 ? '' : 's'} matching "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary hover:underline font-bold text-[11px] cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Onboarded</span>
            <span className="text-2xl font-black text-gray-900 mt-1">{shops.length}</span>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active</span>
            <span className="text-2xl font-black text-emerald-600 mt-1">{shops.filter((s) => s.status === 'Passed').length}</span>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Under review</span>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-2xl font-black text-primary">{shops.filter((s) => s.status === 'Under Review').length}</span>
              <Star size={14} className="text-primary fill-primary mb-1.5 shrink-0" />
            </div>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Need Action</span>
            <span className="text-2xl font-black text-red-500 mt-1 ml-1">{shops.filter((s) => s.status !== 'Passed').length}</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mb-5 text-center font-medium opacity-80">
          Only qualifying shops are counted towards rewards.
        </p>
        
        {/* Horizontal Scrollable Filter Tabs */}
        <div className="relative group/tabs mb-6 -mx-[var(--page-margin)]">
          {showLeftArrow && (
            <button 
              onClick={() => scrollTabs('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-r from-[#fcf9f8] via-[#fcf9f8]/80 to-transparent flex items-center justify-start pl-4 text-primary transition-opacity"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
          )}

          {showRightArrow && (
            <button 
              onClick={() => scrollTabs('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-l from-[#fcf9f8] via-[#fcf9f8]/80 to-transparent flex items-center justify-end pr-4 text-primary transition-opacity"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}

          <div 
            ref={tabsScrollRef}
            className="flex overflow-x-auto no-scrollbar gap-2 px-[var(--page-margin)] snap-x scroll-smooth scroll-pl-[var(--page-margin)]"
          >
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
        </div>

        {/* Bulk Selection Header Bar */}
        <div className="bg-white rounded-2xl p-3 mb-3 border border-gray-100 shadow-xs flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-extrabold text-gray-700 hover:text-primary transition-colors cursor-pointer py-1 px-2.5 rounded-xl bg-gray-50 hover:bg-pink-50/60 border border-gray-200/80 active:scale-95"
            >
              {isAllFilteredSelected ? (
                <CheckSquare size={17} className="text-primary fill-pink-50" />
              ) : (
                <Square size={17} className="text-gray-400" />
              )}
              <span>{isAllFilteredSelected ? 'Deselect All' : 'Select All'}</span>
              <span className="text-[10px] font-bold text-gray-400">({filteredShops.length})</span>
            </button>

            {selectedShopIds.length > 0 && (
              <span className="bg-pink-100 text-primary text-[11px] font-black px-2.5 py-1 rounded-full border border-pink-200">
                {selectedShopIds.length} Selected
              </span>
            )}
          </div>

          {selectedShopIds.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowBulkStatusModal(true)}
                className="bg-pink-50 hover:bg-pink-100 text-primary border border-pink-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Update Status"
              >
                <Tag size={13} /> Status
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Export CSV"
              >
                <Download size={13} /> Export
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                title="Delete Selected"
              >
                <Trash2 size={13} /> Delete
              </button>
              <button
                onClick={() => setSelectedShopIds([])}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                title="Clear selection"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Shop Cards List */}
        <div className="flex flex-col gap-4">
          {/* Location states — requirement #11 exact denied message, plus a
              quiet "nearest first" indicator once the accurate fix locks. */}
          {geo.status === 'denied' && (
            <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-[11px] font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              Please enable location to see nearby salons.
            </div>
          )}
          {geo.status === 'locked' && geo.fix && (
            <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-[11px] font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Sorted by nearest first · GPS ±{Math.round(geo.fix.accuracy)} m
            </div>
          )}
          {visibleShops.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 text-center shadow-xs flex flex-col items-center my-2 relative overflow-hidden"
            >
              {/* Decorative background blur glow */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-100/40 rounded-full blur-2xl pointer-events-none"></div>

              {/* Professional Custom Illustration */}
              <div className="relative mb-5 flex items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-b from-pink-50 to-pink-100/60 text-primary rounded-3xl flex items-center justify-center shadow-xs border border-pink-100 transform -rotate-3 transition-transform hover:rotate-0">
                  <Store size={38} className="text-primary stroke-[1.75]" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-white text-gray-400 rounded-2xl flex items-center justify-center shadow-md border border-gray-100">
                  <SearchX size={18} className="text-primary" />
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">No Shops Found</h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed font-medium">
                {searchQuery || activeTab !== 'All' || selectedSort !== 'Newest First' ? (
                  <>
                    We couldn't find any onboarded shops matching{' '}
                    {searchQuery ? <strong className="text-gray-900">"{searchQuery}"</strong> : 'your current filter settings'}.
                  </>
                ) : (
                  'You haven\'t onboarded any partner shops yet. Onboard retail stores to start earning daily target commissions.'
                )}
              </p>

              {/* Call To Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xs">
                <button
                  onClick={() => onNavigate('add-shop')}
                  className="flex-1 min-w-[130px] bg-primary hover:bg-[#a00056] text-white h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-200/50 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Create New Shop</span>
                </button>

                {(searchQuery || activeTab !== 'All' || selectedSort !== 'Newest First') && (
                  <button
                    onClick={handleClearFilters}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-11 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
            {visibleShops.map((shop) => {
              const isShopSelected = selectedShopIds.includes(shop.id);

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
              <motion.div
                key={shop.id}
                layout
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative rounded-3xl"
              >
                {/* Archive Background */}
                <div className="absolute inset-0 flex items-center justify-end px-6 bg-red-100 rounded-3xl">
                   <Archive size={24} className="text-red-500" />
                </div>
                
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.5, right: 0 }}
                  onDragEnd={(e, { offset }) => {
                    if (offset.x < -100) {
                      handleArchive(shop.id);
                    }
                  }}
                  className={`bg-white rounded-3xl p-4 shadow-sm border ${
                    isShopSelected ? 'border-primary ring-2 ring-primary/40 bg-pink-50/10' : borderStyle
                  } relative overflow-hidden hover:shadow-md h-full w-full transition-all`}
                >
                  {/* Status Strip Accent */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>

                  {/* Card Header */}
                  <div className="flex items-start gap-2.5 mb-3 ml-1">
                    {/* Checkbox button */}
                    <button
                      onClick={(e) => toggleSelectShop(shop.id, e)}
                      className="mt-0.5 text-gray-400 hover:text-primary transition-colors cursor-pointer shrink-0 active:scale-90"
                      aria-label="Select shop"
                    >
                      {isShopSelected ? (
                        <CheckSquare size={20} className="text-primary fill-pink-50" />
                      ) : (
                        <Square size={20} className="text-gray-300 hover:text-gray-500" />
                      )}
                    </button>

                    <div className="flex-1 flex justify-between items-start min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm tracking-tight">{shop.name}</h3>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tagStyle}`}>
                            {shop.displayStatus}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 block tracking-wider">
                          {shop.code} • {shop.area}
                          {shop.distanceM != null && (
                            <span className="text-emerald-600 font-bold"> • {formatDistance(shop.distanceM)}</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shrink-0 ml-1">
                        {shop.type}
                      </span>
                    </div>
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
                </motion.div>
              </motion.div>
              );
            })}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Floating Action Button "Add Shop" */}
      <button
        onClick={() => onNavigate('add-shop')}
        className="fixed right-5 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] bg-primary text-white rounded-2xl h-14 px-5 shadow-lg flex items-center justify-center gap-2 z-40 active:scale-95 hover:scale-102 transition-all cursor-pointer"
      >
        <Plus size={20} className="stroke-[3px]" />
        <span className="text-xs font-extrabold tracking-tight">Add Shop</span>
      </button>

      {/* Floating Bulk Action Bar */}
      {selectedShopIds.length > 0 && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-gray-900/95 text-white backdrop-blur-md rounded-2xl p-3 shadow-2xl z-50 flex items-center justify-between border border-gray-800 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 ml-2">
            <span className="w-7 h-7 bg-primary text-white rounded-xl text-xs font-black flex items-center justify-center shadow-xs">
              {selectedShopIds.length}
            </span>
            <span className="text-xs font-extrabold text-gray-200">Selected</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Tag size={14} className="text-pink-300" />
              <span>Status</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="bg-red-600/90 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setSelectedShopIds([])}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Cancel Selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav onNavigate={onNavigate} currentPage="shops" />

      {/* ================= BULK STATUS UPDATE MODAL ================= */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowBulkStatusModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 animate-in zoom-in-95 border border-gray-100">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-primary" />
                <h3 className="font-extrabold text-sm text-gray-900">Update Status</h3>
              </div>
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 my-3 font-medium">
              Assign new status to <strong className="text-gray-900">{selectedShopIds.length}</strong> selected shop(s):
            </p>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              {[
                { label: 'Qualifying', status: 'Qualifying' as Shop['status'], color: 'text-primary bg-pink-50 border-pink-100' },
                { label: 'Passed', status: 'Passed' as Shop['status'], color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                { label: 'Under Review', status: 'Under Review' as Shop['status'], color: 'text-blue-700 bg-blue-50 border-blue-100' },
                { label: 'Need Changes', status: 'Need Changes' as Shop['status'], color: 'text-rose-700 bg-rose-50 border-rose-100' },
                { label: 'KYC Pending', status: 'KYC Pending' as Shop['status'], color: 'text-amber-800 bg-amber-50 border-amber-100' },
                { label: 'QR Not Active', status: 'QR Not Active' as Shop['status'], color: 'text-amber-700 bg-amber-50 border-amber-100' },
                { label: 'Daily Target Failed', status: 'Daily Target Failed' as Shop['status'], color: 'text-red-700 bg-red-50 border-red-100' },
                { label: 'Draft', status: 'Draft' as Shop['status'], color: 'text-gray-700 bg-gray-100 border-gray-200' },
                { label: 'Rejected', status: 'Rejected' as Shop['status'], color: 'text-red-800 bg-red-100 border-red-200' }
              ].map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => handleBulkStatusUpdate(opt.status)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between hover:scale-[1.01] active:scale-98 cursor-pointer ${opt.color}`}
                >
                  <span>{opt.label}</span>
                  <ChevronRight size={14} className="opacity-60" />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BULK DELETE CONFIRM MODAL ================= */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowBulkDeleteConfirm(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 animate-in zoom-in-95 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} />
            </div>

            <h3 className="font-extrabold text-base text-gray-900">Delete {selectedShopIds.length} Shop(s)?</h3>
            <p className="text-xs text-gray-500 mt-1 mb-5 leading-relaxed font-medium">
              Are you sure you want to remove these selected shops? This action will remove them from your active workspace.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-11 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl text-xs font-bold transition-colors shadow-md shadow-red-200 cursor-pointer active:scale-95"
              >
                Delete Selected
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
                    { title: 'Attribution synced', desc: 'Shop status updated from the live ledger.', time: 'Just now', urgent: false }
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
