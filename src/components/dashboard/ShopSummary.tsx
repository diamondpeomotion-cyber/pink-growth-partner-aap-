import React from 'react';

export default function ShopSummary() {
  const cards = [
    { title: 'Total Shops Onboarded', value: '270', desc: 'All submitted shops' },
    { title: 'Verified Shops', value: '250', desc: 'KYC and shop details verified' },
    { title: 'Qualifying Shops', value: '247', desc: 'Counted towards rewards' },
    { title: 'In 15-Day Cycle', value: '3', desc: 'QR qualification running' },
  ];

  return (
    <section className="w-full space-y-4">
      <h3 className="text-lg font-semibold text-[#1b1c1b] px-1">Shop Qualification Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-[18px] p-4 border border-[#e4e2e1]/40 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
            <span className="text-[11px] font-semibold text-[#5a3f47] uppercase tracking-wider mb-2">{card.title}</span>
            <span className="text-2xl font-semibold text-[#1b1c1b] mb-1">{card.value}</span>
            <span className="text-[12px] text-[#5a3f47]/70">{card.desc}</span>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-[#5a3f47]/70 italic px-1">Shop registration alone does not count towards rewards.</p>
    </section>
  );
}
