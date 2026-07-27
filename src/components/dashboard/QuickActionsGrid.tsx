import React from 'react';
import { QrCode, PlusCircle, Headphones, Gift, Store, DollarSign, Globe, User } from 'lucide-react';

export default function QuickActionsGrid({ onNavigate }: { onNavigate: (page: string) => void }) {
  const actions = [
    { icon: QrCode, label: 'Scan QR', page: 'scan-qr' },
    { icon: PlusCircle, label: 'Add Shop', page: 'add-shop' },
    { icon: Headphones, label: 'Support', page: 'support' },
    { icon: Gift, label: 'Rewards', page: 'rewards' },
    { icon: Store, label: 'My Shops', page: 'shops' },
    { icon: DollarSign, label: 'Payouts', page: 'payouts' },
    { icon: Globe, label: 'Website', page: 'website-settings' },
    { icon: User, label: 'Profile', page: 'profile' },
  ];

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, page: string) => {
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    onNavigate(page);
  };

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div 
        className="flex overflow-x-auto no-scrollbar gap-4 p-4 -mx-4 snap-x scroll-smooth"
        style={{
          maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)'
        }}
      >
        {actions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={(e) => handleActionClick(e, action.page)}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-[24px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 min-w-[100px] shrink-0 snap-center group/btn"
          >
            <div className="p-3 bg-pink-50 rounded-2xl text-primary transition-colors group-hover/btn:bg-pink-100">
              <action.icon size={24} />
            </div>
            <span className="text-[11px] font-extrabold text-gray-800 tracking-tight whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
