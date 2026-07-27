import React from 'react';
import { QrCode, PlusCircle, Headphones, Gift } from 'lucide-react';

export default function QuickActionsGrid({ onNavigate }: { onNavigate: (page: string) => void }) {
  const actions = [
    { icon: QrCode, label: 'Scan QR', page: 'scan-qr' },
    { icon: PlusCircle, label: 'Add Shop', page: 'add-shop' },
    { icon: Headphones, label: 'Support', page: 'support' },
    { icon: Gift, label: 'Rewards', page: 'rewards' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {actions.map((action, idx) => (
        <button 
          key={idx} 
          onClick={() => onNavigate(action.page)}
          className="flex flex-col items-center justify-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
        >
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <action.icon size={20} />
          </div>
          <span className="text-xs font-semibold text-gray-700">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
