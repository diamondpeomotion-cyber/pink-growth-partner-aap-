import React, { useRef, useState, useEffect } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import rewardWelcomeKit from '../../assets/images/reward-welcome-kit.jpg';

export default function CompletedRewards({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const rewards = [
    { title: 'Professional Welcome Package', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-ExG4LCVuMIEW9VhEx0ggi_FPtrYtRRK4RHyGoNPsUVUCFmq87fJPjGoqB9F8LcUp8GaaCawPF9_0RbwIeFA8PLJ3wYignWqlrjasFBPhV35SW7VJKK7sHJqe2KaZ0MjSJL_5rT43oGyB4ZewE3ZUhpsB91Nb28agWZbx0AzmppgAnmO4SdPiEA1WAZi89LzI0ujWajVtFoj619M6ZnGW5a-UGnDOy08xUEHoC4xvUCeBgUOMFNAU' },
    { title: 'Work Tablet Package', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh6Bm_DbL0PFSw9jrXHsycfXy78aBV-1-k644n5aT3dCCJ7UQ9BFwJi8AhGRHOpPgbtWyBi2VSX6hzU8_ut333eCgepTqfiH-MiftrtBiFtSFlVKPlphm_ccazXgtdR2HjQwfnbb7Nzg5ssAGhkFNZDJXbihNJ3hFY3akODEslIl1O0oUHFl224bTHnhb9BrsAI8bf3bCmLUGZnEbgE0QZyUUkOYcIPu0XWalRTg_U4CbIb2Pt9Cdp' },
    { title: 'Laptop Reward', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj4qvoCfbw2YqsfMFy6ggy8_48o0zLkh_fRyseE5HItG5umSe3ILYlCEDqdaPWFMQ44tkViGnW48E2Z__U5W-SuQRDw9Ctf1bF2yg9eA93g9u3gSRB4hHKlMNm3zn0FT7GE84qZYmE48cWxIcKdDC-3coaWH3U9RLOgeVsCFg3p2SUouQtqmgEgXdeV4jXvU0EffYkUvSx7KmL3jOGSyVFFl73q4nQQX3DBVF-si2vZNv1c2_l77uv' },
    { title: 'Business Branding Kit', status: 'Delivered', image: rewardWelcomeKit },
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
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative group">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-semibold text-[#1b1c1b]">Completed Rewards</h3>
        <button 
          onClick={() => onNavigate?.('rewards')}
          className="text-primary text-xs font-bold hover:underline"
        >
          View History
        </button>
      </div>

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
        className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x scroll-smooth"
      >
        {rewards.map((reward, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-[16px] p-3 border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 min-w-[280px] shrink-0 snap-start"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#e4e2e1]">
              <img 
                alt={reward.title} 
                className="w-full h-full object-cover" 
                src={reward.image} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200&auto=format&fit=crop';
                }}
              />
            </div>
            <div className="flex flex-col justify-center flex-grow min-w-0">
              <h4 className="text-[14px] font-semibold text-[#1b1c1b] truncate mb-1">{reward.title}</h4>
              <div className="flex items-center gap-1 w-max px-2 py-0.5 bg-[#2e7d32]/10 rounded-full">
                <CheckCircle className="text-[#2e7d32]" size={12} />
                <span className="text-[9px] font-semibold text-[#2e7d32] uppercase tracking-wider">{reward.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
