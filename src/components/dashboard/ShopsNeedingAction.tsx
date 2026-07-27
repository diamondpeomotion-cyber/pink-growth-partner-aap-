import React from 'react';
import { CheckCircle, QrCode, TrendingDown, Pencil } from 'lucide-react';

export default function ShopsNeedingAction({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const actions = [
    { title: 'KYC Pending', count: '4 Shops', icon: CheckCircle, color: '#ed6c02', bg: 'bg-[#ed6c02]/10', btn: 'Review KYC', page: 'shops' },
    { title: 'QR Not Active', count: '2 Shops', icon: QrCode, color: '#0052da', bg: 'bg-[#0052da]/10', btn: 'Activate QR', page: 'scan-qr' },
    { title: 'Target Failed', count: '7 Shops', icon: TrendingDown, color: '#ed6c02', bg: 'bg-[#ed6c02]/10', btn: 'View Stats', page: 'earnings' },
    { title: 'Need Changes', count: '3 Shops', icon: Pencil, color: '#b90064', bg: 'bg-[#b90064]/10', btn: 'Fix Issues', page: 'shops' },
  ];

  return (
    <section>
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Shops Needing Action</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, idx) => (
          <div key={idx} className="bg-white rounded-[18px] p-4 border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3 active:scale-[0.98] transition-transform">
            <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center`}>
              <action.icon color={action.color} size={24} />
            </div>
            <div>
              <p className="text-[13px] text-[#5a3f47]">{action.title}</p>
              <p className="text-xl font-bold text-[#1b1c1b]">{action.count}</p>
            </div>
            <button 
              onClick={() => onNavigate?.(action.page)}
              className="w-full py-2 bg-[#f0edec] text-[#5a3f47] text-[13px] rounded-lg hover:bg-[#e4e2e1] transition-colors"
            >
              {action.btn}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
