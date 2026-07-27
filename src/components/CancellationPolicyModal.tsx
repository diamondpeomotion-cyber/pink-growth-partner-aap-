import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function CancellationPolicyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-primary">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Cancellation & Refund Policy</h2>
              <p className="text-xs text-gray-500">Nexora Platform Legal & Compliance</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-200/60 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-700 leading-relaxed">
          <div className="bg-pink-50/60 p-4 rounded-2xl border border-pink-100 flex items-start gap-3">
            <FileText size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 font-medium">
              This Cancellation & Refund Policy applies to all bookings, partner shop onboarding, and growth partner incentives across the Nexora platform.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base">1. Customer Booking Cancellation</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li>Customers can cancel appointments up to 2 hours before the scheduled time without any cancellation fee.</li>
              <li>Late cancellations (within 2 hours of booking time) or no-shows may incur a cancellation fee of up to 50% of the service amount.</li>
              <li>Partner shops reserve the right to reschedule appointments in case of unforeseen emergencies with prior notice to the customer.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base">2. Refund Terms & Timelines</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li>Eligible refunds for online pre-paid bookings will be processed back to the original payment method (UPI, Credit/Debit Card, Netbanking) within 5-7 business days.</li>
              <li>Cash payments made directly at partner shops are subject to the individual shop's receipt and refund verification policy.</li>
              <li>Service dissatisfaction claims must be raised with support within 24 hours of appointment completion for investigation.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900 text-base">3. Partner Shop & Growth Partner Agreement</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
              <li>Partner shops must honor confirmed customer bookings and maintain accurate cancellation logs.</li>
              <li>Growth partner incentives and payouts are calculated based on genuine completed shop bookings and qualifying metrics. Commission reversals apply for cancelled or disputed bookings.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-500">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Last updated: July 2026 • Nexora Technologies Inc.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-colors cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>

      </div>
    </div>
  );
}
