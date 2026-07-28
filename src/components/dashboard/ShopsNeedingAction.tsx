import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, QrCode, TrendingDown, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShopsNeedingAction({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const actions = [
    { title: 'KYC Pending', count: '4 Shops', icon: CheckCircle, color: '#ed6c02', bg: 'bg-[#ed6c02]/10', btn: 'Review KYC', page: 'shops' },
    { title: 'QR Not Active', count: '2 Shops', icon: QrCode, color: '#0052da', bg: 'bg-[#0052da]/10', btn: 'Activate QR', page: 'scan-qr' },
    { title: 'Target Failed', count: '7 Shops', icon: TrendingDown, color: '#ed6c02', bg: 'bg-[#ed6c02]/10', btn: 'View Stats', page: 'earnings' },
    { title: 'Need Changes', count: '3 Shops', icon: Pencil, color: '#b90064', bg: 'bg-[#b90064]/10', btn: 'Fix Issues', page: 'shops' },
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
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative group">
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Shops Needing Action</h3>
      
      {showLeftArrow && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-[calc(50%+12px)] -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90 -ml-2"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {showRightArrow && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-[calc(50%+12px)] -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-primary border border-gray-100 hover:bg-white transition-all active:scale-90 -mr-2"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar gap-4 pb-4 snap-x scroll-smooth"
      >
        {actions.map((action, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-[18px] p-4 border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3 active:scale-[0.98] transition-transform min-w-[160px] shrink-0 snap-start"
          >
            <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center`}>
              <action.icon color={action.color} size={24} />
            </div>
            <div>
              <p className="text-[12px] text-[#5a3f47] leading-tight mb-0.5">{action.title}</p>
              <p className="text-lg font-bold text-[#1b1c1b]">{action.count}</p>
            </div>
            <button 
              onClick={() => onNavigate?.(action.page)}
              className="w-full py-2 bg-[#f0edec] text-[#5a3f47] text-[12px] font-semibold rounded-lg hover:bg-[#e4e2e1] transition-colors"
            >
              {action.btn}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
