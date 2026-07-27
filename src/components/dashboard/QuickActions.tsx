import React from 'react';
import { PlusCircle, Store, Wallet, Gift, Share2 } from 'lucide-react';

export default function QuickActions({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const actions = [
    { icon: PlusCircle, label: 'Add Shop', color: '#b90064', page: 'add-shop' },
    { icon: Store, label: 'My Shops', color: '#0052da', page: 'shops' },
    { icon: Wallet, label: 'View Earnings', color: '#2e7d32', page: 'earnings' },
    { icon: Gift, label: 'View Rewards', color: '#ed6c02', page: 'rewards' },
    { icon: Share2, label: 'Share Referral', color: '#b80663', page: 'profile' },
  ];

  return (
    <section className="-mx-5 px-5">
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Quick Actions</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth">
        {actions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={() => onNavigate?.(action.page)}
            className="flex-shrink-0 w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all hover:shadow-md snap-start"
          >
            <action.icon color={action.color} size={28} />
            <span className="text-[10px] leading-tight text-center text-[#1b1c1b]">{action.label.split(' ').map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
