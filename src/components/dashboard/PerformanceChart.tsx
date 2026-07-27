import React from 'react';

export default function PerformanceChart() {
  const chartData = [
    { day: 'Mon', revenue: 40, commission: 60 },
    { day: 'Tue', revenue: 30, commission: 50 },
    { day: 'Wed', revenue: 50, commission: 80 },
    { day: 'Thu', revenue: 45, commission: 70 },
    { day: 'Fri', revenue: 60, commission: 90 },
    { day: 'Sat', revenue: 35, commission: 55 },
    { day: 'Sun', revenue: 20, commission: 40 },
  ];

  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">This Week’s QR Performance</h3>
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['7 Days', '30 Days', '3 Months'].map((filter, i) => (
          <button key={i} className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap ${i === 0 ? 'bg-[#e6007e] text-white' : 'bg-[#f0edec] text-[#5a3f47] hover:bg-[#e4e2e1]'}`}>
            {filter}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-[18px] border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-5 mb-4">
        <div className="flex justify-between items-end h-32 gap-2 mb-4">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <div className="w-full bg-[#e6007e]/20 rounded-t-sm" style={{ height: `${d.revenue}%` }}></div>
              <div className="w-full bg-[#e6007e] rounded-t-sm" style={{ height: `${d.commission}%` }}></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#8e6f77] font-medium uppercase tracking-tighter">
          {chartData.map((d, i) => <span key={i}>{d.day}</span>)}
        </div>
        <div className="flex gap-4 mt-6 pt-4 border-t border-[#e4e2e1]/30">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#e6007e]"></div><span className="text-[11px] font-medium text-[#5a3f47]">QR Revenue</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0052da]"></div><span className="text-[11px] font-medium text-[#5a3f47]">Commission</span></div>
        </div>
      </div>
      <div className="bg-white rounded-[18px] border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center"><span className="text-[13px] text-[#5a3f47]">QR Revenue</span><span className="text-[18px] font-semibold text-[#1b1c1b]">₹68,000</span></div>
          <div className="flex justify-between items-center"><span className="text-[13px] text-[#5a3f47]">Nexora Commission</span><span className="text-[18px] font-semibold text-[#0052da]">₹6,800</span></div>
          <div className="flex justify-between items-center pt-3 border-t border-[#e4e2e1]/30"><span className="text-[13px] font-semibold text-[#1b1c1b]">Your Earnings</span><span className="text-xl font-bold text-[#b90064]">₹680</span></div>
        </div>
      </div>
    </section>
  );
}
