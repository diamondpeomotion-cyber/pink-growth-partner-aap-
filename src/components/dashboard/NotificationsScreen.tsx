import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  QrCode,
  Store,
  Wallet,
  Gift,
  MessageSquare,
  Clock,
  CheckCircle2,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  Headphones,
  SlidersHorizontal,
  Search,
  Check,
  Trash2,
  Inbox
} from 'lucide-react';
import BottomNav from './BottomNav';
import { supabase } from '../../lib/supabaseClient';
import { fetchPartnerNotifications } from '../../lib/gpRepository';

export type NotificationCategory = 'All' | 'Payments' | 'Support' | 'System';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  category: 'Payments' | 'Support' | 'System';
  type: 'qr' | 'shop' | 'payout' | 'payment' | 'reward' | 'support' | 'system';
  buttonLabel: string;
}



const CATEGORY_TABS: { id: NotificationCategory; label: string; icon: React.ElementType }[] = [
  { id: 'All', label: 'All Alerts', icon: Bell },
  { id: 'Payments', label: 'Payments', icon: CreditCard },
  { id: 'Support', label: 'Support', icon: Headphones },
  { id: 'System', label: 'System', icon: ShieldAlert }
];

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('All');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const rows = await fetchPartnerNotifications(supabase, user.id);
        if (cancelled) return;
        setNotifications(rows.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.createdAt ? new Date(n.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
          unread: !n.read,
          category: (n.type === 'payment' || n.type === 'payout' ? 'Payments' : n.type === 'support' ? 'Support' : 'System') as NotificationItem['category'],
          type: (n.type === 'payout' || n.type === 'payment' ? 'payout' : n.type === 'support' ? 'support' : 'system') as NotificationItem['type'],
          buttonLabel: '',
        })));
      } catch (err) {
        console.warn('Notifications load failed:', err);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      window.addEventListener('resize', handleScroll);
      return () => {
        el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev =>
      prev.map(n => {
        if (activeTab === 'All' || n.category === activeTab) {
          return { ...n, unread: false };
        }
        return n;
      })
    );
  };

  const handleToggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'qr': return <QrCode size={18} />;
      case 'shop': return <Store size={18} />;
      case 'payout':
      case 'payment': return <Wallet size={18} />;
      case 'reward': return <Gift size={18} />;
      case 'support': return <MessageSquare size={18} />;
      case 'system': return <ShieldAlert size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getIconBg = (type: NotificationItem['type'], category: NotificationCategory) => {
    if (category === 'Payments' || type === 'payout' || type === 'payment') {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200/80';
    }
    if (category === 'Support' || type === 'support') {
      return 'bg-blue-50 text-blue-600 border border-blue-200/80';
    }
    if (type === 'qr' || type === 'reward') {
      return 'bg-pink-50 text-[#b90064] border border-pink-200/80';
    }
    return 'bg-amber-50 text-amber-600 border border-amber-200/80';
  };

  const getCategoryBadge = (category: 'Payments' | 'Support' | 'System') => {
    switch (category) {
      case 'Payments':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
            Payments
          </span>
        );
      case 'Support':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
            Support
          </span>
        );
      case 'System':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 shrink-0">
            System
          </span>
        );
    }
  };

  // Filtered List Computation
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab !== 'All' && notif.category !== activeTab) return false;
    if (unreadOnly && !notif.unread) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(q) ||
        notif.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Category counts
  const counts = {
    All: notifications.length,
    Payments: notifications.filter(n => n.category === 'Payments').length,
    Support: notifications.filter(n => n.category === 'Support').length,
    System: notifications.filter(n => n.category === 'System').length,
    Unread: notifications.filter(n => n.unread).length
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-32 font-sans">
      
      {/* Top Header */}
      <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-xs border-b border-gray-100">
        <div className="flex items-center justify-between px-[var(--page-margin)] h-16 w-full max-w-screen-xl mx-auto gap-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors active:scale-95 text-[#b90064] cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 text-center min-w-0">
            <h1 className="text-lg font-bold text-[#b90064] tracking-tight flex items-center justify-center gap-1.5">
              <span>Notifications</span>
              {counts.Unread > 0 && (
                <span className="bg-[#b90064] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                  {counts.Unread} new
                </span>
              )}
            </h1>
          </div>

          <button 
            onClick={handleMarkAllRead}
            disabled={counts.Unread === 0}
            className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 bg-pink-50 text-[#b90064] hover:bg-pink-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">Mark All Read</span>
            <span className="sm:hidden">Read</span>
          </button>
        </div>

        {/* Primary Tab Filters: All, Payments, Support, System */}
        <div className="relative border-t border-gray-100 bg-gray-50/80">
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-r from-white via-white/80 to-transparent flex items-center justify-start pl-1 text-[#b90064]"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
          )}

          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent flex items-center justify-end pr-1 text-[#b90064]"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}

          <div 
            ref={scrollRef}
            className="w-full max-w-screen-xl mx-auto px-[var(--page-margin)] overflow-x-auto no-scrollbar py-2.5 flex items-center gap-2 scroll-smooth"
          >
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              const countVal = counts[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                    isActive 
                      ? 'bg-[#b90064] text-white shadow-md shadow-pink-200/60' 
                      : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100/80 hover:text-gray-900'
                  }`}
                >
                  <TabIcon size={14} className={isActive ? 'text-white' : 'text-gray-500'} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {countVal}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Unread Filter Sub-bar */}
        <div className="w-full max-w-screen-xl mx-auto px-[var(--page-margin)] py-2.5 flex items-center gap-2 border-t border-gray-100 bg-white">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-[#b90064]"
            />
          </div>

          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              unreadOnly
                ? 'bg-pink-100 text-[#b90064] border border-pink-200'
                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Unread ({counts.Unread})</span>
          </button>
        </div>
      </header>

      {/* Main Content List */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-[var(--page-margin)] py-5 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className={`relative bg-white rounded-[18px] border shadow-xs p-4 flex flex-col gap-3 group transition-all hover:shadow-md ${
                  notif.unread
                    ? 'border-pink-200/90 bg-white'
                    : 'border-gray-100/90 opacity-80 hover:opacity-100 bg-gray-50/30'
                }`}
              >
                {/* Unread Accent Bar */}
                {notif.unread && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#b90064] rounded-l-full"></div>
                )}

                <div className="flex gap-3 items-start justify-between">
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${getIconBg(notif.type, notif.category)}`}>
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(notif.category)}
                        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                          <Clock size={11} className="text-gray-300" />
                          {notif.time}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#1b1c1b] leading-snug tracking-tight group-hover:text-[#b90064] transition-colors">
                        {notif.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleRead(notif.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        notif.unread
                          ? 'bg-pink-50 text-[#b90064] hover:bg-pink-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={notif.unread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleArchive(notif.id)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Archive notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Primary Button Action */}
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      if (onNavigate) {
                        if (notif.type === 'shop' || notif.type === 'qr') onNavigate('shops');
                        else if (notif.type === 'payout' || notif.type === 'payment') onNavigate('earnings');
                        else onNavigate('support');
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                      notif.unread
                        ? 'bg-[#FDE7F3] text-[#b90064] hover:bg-pink-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{notif.buttonLabel}</span>
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center gap-3 my-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[#b90064] flex items-center justify-center">
                <Inbox size={28} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-base font-bold text-gray-900">No Notifications Found</h3>
                <p className="text-xs text-gray-500">
                  {unreadOnly
                    ? 'No unread notifications in this category.'
                    : `There are no ${activeTab === 'All' ? '' : activeTab} notifications at this moment.`}
                </p>
              </div>
              {(unreadOnly || searchQuery || activeTab !== 'All') && (
                <button
                  onClick={() => {
                    setActiveTab('All');
                    setUnreadOnly(false);
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-[#b90064] bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav onNavigate={onNavigate} currentPage="notifications" />

    </div>
  );
}

