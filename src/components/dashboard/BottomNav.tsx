import React from 'react';
import { Home, Store, DollarSign, Award, User, Bell } from 'lucide-react';

export default function BottomNav({ onNavigate, currentPage }: { onNavigate?: (page: string) => void, currentPage?: string }) {
  const items = [
    { icon: Home, label: 'Home', page: 'dashboard' },
    { icon: Store, label: 'Network', page: 'shops' },
    { icon: Bell, label: 'Alerts', page: 'notifications' },
    { icon: DollarSign, label: 'Earnings', page: 'earnings' },
    { icon: User, label: 'Profile', page: 'profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md mx-auto z-50 rounded-t-2xl bg-white/80 backdrop-blur-md shadow-[0px_-4px_20px_rgba(0,0,0,0.03)] border-t border-gray-100 flex justify-around items-center h-[calc(5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2">
      {items.map((item, idx) => {
        const isActive = item.page === currentPage || (item.page === 'dashboard' && !currentPage);
        
        return (
          <button 
            key={idx} 
            onClick={() => {
              onNavigate?.(item.page);
            }}
            className={`flex flex-col items-center justify-center transition-all active:scale-90 w-16 h-14 ${
              isActive 
                ? 'text-[#b90064] bg-[#fde7f3] rounded-2xl px-3 py-1 font-bold' 
                : 'text-[#5a3f47] hover:opacity-80'
            }`}
          >
            <item.icon size={20} className="mb-1" strokeWidth={isActive ? 2.5 : 2} style={isActive ? { fill: '#e6007e' } : {}} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

