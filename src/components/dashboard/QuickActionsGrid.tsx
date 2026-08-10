import React, { useRef, useState, useEffect } from 'react';
import { QrCode, PlusCircle, Headphones, Gift, Store, DollarSign, Globe, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QuickActionsGrid({ onNavigate }: { onNavigate: (page: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const actions = [
    { icon: QrCode, label: 'Scan QR', page: 'scan-qr' },
    { icon: PlusCircle, label: 'Add Shop', page: 'add-shop' },
    { icon: Headphones, label: 'Support', page: 'support' },
    { icon: Gift, label: 'Rewards', page: 'rewards' },
    { icon: Store, label: 'My Shops', page: 'shops' },
    { icon: DollarSign, label: 'Payouts', page: 'payouts' },
    { icon: Globe, label: 'Website', page: 'website-onboarding' },
    { icon: User, label: 'Profile', page: 'profile' },
  ];

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
      // Initial check
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
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, page: string) => {
    onNavigate(page);
  };

  return (
    <div className="relative group">
      {/* Scroll Arrows - Hidden on mobile, shown on hover/active on desktop */}
      {showLeftArrow && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90 -ml-2"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {showRightArrow && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90 -mr-2"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-3 pb-2 snap-x scroll-smooth"
      >
        {actions.map((action, idx) => (
          <button 
            key={idx} 
            onClick={(e) => handleActionClick(e, action.page)}
            className="flex flex-col items-center justify-center gap-2 p-3 bg-white rounded-[24px] shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 min-w-[96px] shrink-0 snap-start group/btn"
          >
            <div className="p-3 bg-pink-50 rounded-2xl text-primary transition-colors group-hover/btn:bg-pink-100">
              <action.icon size={22} />
            </div>
            <span className="text-[10px] font-bold text-gray-800 tracking-tight whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
