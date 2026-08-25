import React from 'react';
import { Gift } from 'lucide-react';

export default function CompletedRewards({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return (
    <section className="relative">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-semibold text-[#1b1c1b]">Rewards</h3>
        <button onClick={() => onNavigate?.('rewards')} className="text-primary text-xs font-bold hover:underline">
          View milestones
        </button>
      </div>
      <div className="bg-white rounded-[16px] p-5 border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-50 text-primary flex items-center justify-center shrink-0">
          <Gift size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">No rewards have been issued yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Milestone progress uses your live attributed shop count. This app never marks a kit, tablet, or scooter as delivered unless the ledger says so.
          </p>
        </div>
      </div>
    </section>
  );
}
