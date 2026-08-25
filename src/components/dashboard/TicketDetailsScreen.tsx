import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TicketDetailsScreen({
  ticketId = '',
  onBack
}: {
  ticketId?: string;
  onBack: () => void;
}) {
  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors active:scale-95 text-[#b90064] cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#b90064] flex-1 text-center tracking-tight">Help & Support</h1>
        <div className="w-10" />
      </header>

      <section className="bg-white px-5 py-6 shadow-xs border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#1b1c1b] tracking-tight">Ticket</h2>
        <p className="text-sm text-gray-500 mt-1">
          {ticketId ? `Reference ${ticketId} is not loaded from the database.` : 'No ticket is selected.'}
        </p>
        <p className="text-xs text-gray-400 mt-3">
          This app does not host a live support inbox. There is no canned conversation with Nexora support.
        </p>
      </section>
    </div>
  );
}
