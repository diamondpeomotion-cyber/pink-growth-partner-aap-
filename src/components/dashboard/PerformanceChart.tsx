import React from 'react';
import { formatINR } from '../../lib/gpRepository';

export default function PerformanceChart({
  payableAmount = 0,
  heldAmount = 0,
  paidAmount = 0,
}: {
  payableAmount?: number;
  heldAmount?: number;
  paidAmount?: number;
}) {
  const total = payableAmount + heldAmount + paidAmount;
  const empty = total === 0;
  const bars = [
    { label: 'Held', value: heldAmount, color: 'bg-[#e6007e]/40' },
    { label: 'Payable', value: payableAmount, color: 'bg-[#e6007e]' },
    { label: 'Paid', value: paidAmount, color: 'bg-[#0052da]' },
  ];
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <section className="mt-8">
      <h3 className="text-xl font-semibold text-[#1b1c1b] mb-4 px-1">Commission ledger mix</h3>
      <div className="bg-white rounded-[18px] border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-5 mb-4">
        {empty ? (
          <p className="text-sm text-gray-500">No QR commissions recorded yet. This chart fills from growth_partner_commissions.</p>
        ) : (
          <>
            <div className="flex justify-between items-end h-32 gap-2 mb-4">
              {bars.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col justify-end gap-1">
                  <div className={`w-full ${d.color} rounded-t-sm`} style={{ height: `${(d.value / max) * 100}%` }}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-[#8e6f77] font-medium uppercase tracking-tighter">
              {bars.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="bg-white rounded-[18px] border border-[#e4e2e1]/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#5a3f47]">Held</span>
            <span className="text-[18px] font-semibold text-[#1b1c1b]">{formatINR(heldAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#5a3f47]">Payable</span>
            <span className="text-[18px] font-semibold text-[#0052da]">{formatINR(payableAmount)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-[#e4e2e1]/30">
            <span className="text-[13px] font-semibold text-[#1b1c1b]">Paid</span>
            <span className="text-xl font-bold text-[#b90064]">{formatINR(paidAmount)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
