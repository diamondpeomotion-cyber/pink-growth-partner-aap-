import React, { useRef, useState, useEffect } from 'react';
import { PlusCircle, Store, Wallet, Gift, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QuickActions({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const actions = [
    { icon: PlusCircle, label: 'Add Shop', color: '#b90064', page: 'add-shop' },
    { icon: Store, label: 'My Shops', color: '#0052da', page: 'shops' },
    { icon: Wallet, label: 'View Earnings', color: '#2e7d32', page: 'earnings' },
    { icon: Gift, label: 'View Rewards', color: '#ed6c02', page: 'rewards' },
    { icon: Share2, label: 'Share Referral', color: '#b80663', page: 'profile' },
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
      const scrollAmount = 160;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="-mx-[var(--page-margin)] px-[var(--page-margin)] relative group">
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Quick Actions</h3>
      
      {showLeftArrow && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-2 top-[calc(50%+12px)] -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {showRightArrow && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-2 top-[calc(50%+12px)] -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory scroll-smooth"
      >
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
