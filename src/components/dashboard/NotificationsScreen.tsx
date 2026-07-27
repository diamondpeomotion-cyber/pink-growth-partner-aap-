import React, { useState } from 'react';
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
  Bell
} from 'lucide-react';
import BottomNav from './BottomNav';

interface Notification {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'qr' | 'shop' | 'payout' | 'reward' | 'support';
  buttonLabel: string;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Glow Beauty Parlour completed Day 9 QR target',
    time: '2h ago',
    unread: true,
    type: 'qr',
    buttonLabel: 'View Shop'
  },
  {
    id: 'n2',
    title: 'Royal Cut Salon missed today’s ₹1,000 target',
    time: '4h ago',
    unread: false,
    type: 'shop',
    buttonLabel: 'View Shop'
  },
  {
    id: 'n3',
    title: '₹7,850 payout completed',
    time: 'Yesterday',
    unread: false,
    type: 'payout',
    buttonLabel: 'View Payout'
  },
  {
    id: 'n4',
    title: 'Electric Scooter progress reached 247 shops',
    time: 'Yesterday',
    unread: true,
    type: 'reward',
    buttonLabel: 'View Reward'
  }
];

const FILTERS = [
  'All', 'Shops', 'QR Qualification', 'Earnings', 'Payouts', 'Rewards', 'Support'
];

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const [activeFilter, setActiveFilter] = useState('All');

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'qr': return <QrCode size={18} />;
      case 'shop': return <Store size={18} />;
      case 'payout': return <Wallet size={18} />;
      case 'reward': return <Gift size={18} />;
      case 'support': return <MessageSquare size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getIconBg = (type: Notification['type']) => {
    switch (type) {
      case 'qr': return 'bg-pink-50 text-[#b90064]';
      case 'shop': return 'bg-gray-100 text-gray-500';
      case 'payout': return 'bg-emerald-50 text-emerald-500';
      case 'reward': return 'bg-pink-50 text-[#b90064]';
      case 'support': return 'bg-blue-50 text-blue-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative pb-32 font-sans">
      
      {/* Top Header */}
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-16 w-full max-w-xl mx-auto">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors active:scale-95 text-[#b90064] cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-[#b90064] flex-1 text-center tracking-tight">Notifications</h1>
          <button className="text-[10px] font-black text-[#b90064] uppercase tracking-widest hover:bg-pink-50 px-3 py-2 rounded-lg transition-colors cursor-pointer active:scale-95">
            Mark All Read
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="w-full max-w-xl mx-auto px-5 overflow-x-auto no-scrollbar py-3 flex gap-2.5 border-t border-gray-50">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                activeFilter === filter 
                  ? 'bg-[#b90064] text-white shadow-md shadow-pink-100' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6 flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {NOTIFICATIONS.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 flex flex-col gap-4 group overflow-hidden transition-all hover:shadow-md ${
                !notif.unread ? 'opacity-70 hover:opacity-100' : ''
              }`}
            >
              {notif.unread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b90064]"></div>
              )}
              
              <div className="flex gap-4 items-start">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-xs ${getIconBg(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-[#1b1c1b] leading-snug tracking-tight group-hover:text-[#b90064] transition-colors">
                    {notif.title}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-300" />
                    {notif.time}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className={`w-full h-11 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer ${
                  notif.unread 
                    ? 'bg-[#FDE7F3] text-[#b90064] hover:bg-pink-100' 
                    : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                }`}>
                  {notif.buttonLabel}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      <BottomNav onNavigate={onNavigate} currentPage="notifications" />

    </div>
  );
}
