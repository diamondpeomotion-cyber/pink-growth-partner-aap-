import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function CompletedRewards({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const rewards = [
    { title: 'Professional Welcome Package', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-ExG4LCVuMIEW9VhEx0ggi_FPtrYtRRK4RHyGoNPsUVUCFmq87fJPjGoqB9F8LcUp8GaaCawPF9_0RbwIeFA8PLJ3wYignWqlrjasFBPhV35SW7VJKK7sHJqe2KaZ0MjSJL_5rT43oGyB4ZewE3ZUhpsB91Nb28agWZbx0AzmppgAnmO4SdPiEA1WAZi89LzI0ujWajVtFoj619M6ZnGW5a-UGnDOy08xUEHoC4xvUCeBgUOMFNAU' },
    { title: 'Work Tablet Package', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh6Bm_DbL0PFSw9jrXHsycfXy78aBV-1-k644n5aT3dCCJ7UQ9BFwJi8AhGRHOpPgbtWyBi2VSX6hzU8_ut333eCgepTqfiH-MiftrtBiFtSFlVKPlphm_ccazXgtdR2HjQwfnbb7Nzg5ssAGhkFNZDJXbihNJ3hFY3akODEslIl1O0oUHFl224bTHnhb9BrsAI8bf3bCmLUGZnEbgE0QZyUUkOYcIPu0XWalRTg_U4CbIb2Pt9Cdp' },
    { title: 'Laptop Reward', status: 'Delivered', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj4qvoCfbw2YqsfMFy6ggy8_48o0zLkh_fRyseE5HItG5umSe3ILYlCEDqdaPWFMQ44tkViGnW48E2Z__U5W-SuQRDw9Ctf1bF2yg9eA93g9u3gSRB4hHKlMNm3zn0FT7GE84qZYmE48cWxIcKdDC-3coaWH3U9RLOgeVsCFg3p2SUouQtqmgEgXdeV4jXvU0EffYkUvSx7KmL3jOGSyVFFl73q4nQQX3DBVF-si2vZNv1c2_l77uv' },
  ];

  return (
    <section>
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Rewards You Have Completed</h3>
      <div className="flex flex-col gap-4">
        {rewards.map((reward, idx) => (
          <div key={idx} className="bg-white rounded-[16px] p-3 border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#e4e2e1]">
              <img alt={reward.title} className="w-full h-full object-cover" src={reward.image} />
            </div>
            <div className="flex flex-col justify-center flex-grow min-w-0">
              <h4 className="text-[15px] font-semibold text-[#1b1c1b] truncate mb-1">{reward.title}</h4>
              <div className="flex items-center gap-1 w-max px-2 py-0.5 bg-[#2e7d32]/10 rounded-full">
                <CheckCircle className="text-[#2e7d32]" size={12} />
                <span className="text-[10px] font-semibold text-[#2e7d32] uppercase tracking-wider">{reward.status}</span>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={() => onNavigate?.('rewards')}
          className="w-full mt-2 py-3.5 border-2 border-[#e2bdc7] text-[#b90064] font-medium text-[13px] rounded-[16px] flex items-center justify-center gap-2 hover:bg-[#f6f3f2] transition-colors active:scale-[0.98]"
        >
          View Reward History
        </button>
      </div>
    </section>
  );
}
