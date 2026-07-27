import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Paperclip,
  Send,
  FileText,
  CheckCheck,
  Headphones,
  User,
  MoreVertical
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'support' | 'user';
  text: string;
  time: string;
  attachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'image';
  };
}

const MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'support',
    text: 'Hello Rajesh, we are looking into the payout discrepancy for July Week 3. Could you please provide the bank statement for that specific period to help us verify the transactions?',
    time: '10:42 AM'
  },
  {
    id: 'm2',
    sender: 'user',
    text: "Hi, thanks for getting back to me so quickly. I've attached the bank statement as requested. Let me know if you need anything else to resolve this.",
    time: '10:45 AM',
    attachment: {
      name: 'Bank Statement_JulyW3.pdf',
      size: '1.2 MB',
      type: 'pdf'
    }
  },
  {
    id: 'm3',
    sender: 'support',
    text: 'Thank you, Rajesh. We have received the document and are processing it with our finance team. We expect to have an update for you within 24 hours.',
    time: '11:10 AM'
  }
];

export default function TicketDetailsScreen({
  ticketId = 'TK-882',
  onBack
}: {
  ticketId?: string;
  onBack: () => void;
}) {
  const [inputText, setInputText] = useState('');

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-hidden font-sans">
      
      {/* Top Header */}
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors active:scale-95 text-[#b90064] cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#b90064] flex-1 text-center tracking-tight">Help & Support</h1>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy6hBXYrmOKccJ8RjKAe7kpKClrr-9OypinMvvOA-LCNcjimH7jJbcj3DieYl_wz-RVBdcif-aDklQv8RYt45qr3Sk0pdq2P-dZ8gMvDB_EMjnyc3zJRXwFW6yvJDFjX898GvU4gXDlzJFGaij2t5iaE6hIodnoEnagr4jCr-arF0_Dsj-IEp0PusKkFAW92STh-4NU3yqtbMYNePhl4Jmq1979DzQnvLpt0U2xWQUS0B5eWRPw90S" 
            alt="Partner Profile"
          />
        </div>
      </header>

      {/* Ticket Info Section */}
      <section className="bg-white px-5 py-4 shadow-xs z-40 relative border-b border-gray-100">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-bold text-[#1b1c1b] tracking-tight">Ticket Details</h2>
          <span className="px-3 py-1 bg-[#FDE7F3] text-[#b90064] rounded-full text-[10px] font-black uppercase tracking-wider">
            In Progress
          </span>
        </div>
        <p className="text-sm font-bold text-[#5a3f47] mb-1">Payout Discrepancy - July Week 3</p>
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Created: 15 Aug 2026 • #{ticketId}
        </p>
      </section>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6 pb-[100px] bg-[#fcf9f8]">
        {MESSAGES.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${
              msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border shadow-xs ${
              msg.sender === 'user' ? 'border-pink-100' : 'bg-gray-100 border-gray-200'
            }`}>
              {msg.sender === 'support' ? (
                <Headphones size={16} className="text-gray-500" />
              ) : (
                <img 
                  className="w-full h-full object-cover rounded-full"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWHjj9xZQb_w8j2P0x2vOQsY4fEbCORheOqLTOaV038hEtaF73IaI7PkWawFEiCVCsJhGe-BL34d73p_o38KlFM8oAa0UbJmG1pDwVuRMPZ__c9_uWEHMvPl_JcxzlWhC8iMu-73AGnp099QqQdNwAd6n_YFzMjCpKvAKEycZAbJXMX0RlPUOn7VfCcuAWW_Q6T7jgZgZEOHhYdtD680egL21e2p7mCTPTiG0q6YowQYfIVfYryc_5"
                  alt="User"
                />
              )}
            </div>
            
            <div className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end' : ''}`}>
              <span className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                {msg.sender === 'support' ? 'Nexora Support' : 'Rajesh Kumar'} • {msg.time}
              </span>
              
              <div className={`rounded-2xl p-4 shadow-sm border ${
                msg.sender === 'user' 
                  ? 'bg-[#b90064] text-white rounded-tr-sm border-[#b90064] shadow-[0px_8px_30px_rgba(185,0,100,0.15)]' 
                  : 'bg-white text-[#1b1c1b] rounded-tl-sm border-gray-100'
              }`}>
                <p className="text-xs font-semibold leading-relaxed">{msg.text}</p>
              </div>

              {msg.attachment && (
                <div className="mt-2 flex w-full justify-end">
                  <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors w-full max-w-xs group">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[11px] font-bold text-[#1b1c1b] truncate">{msg.attachment.name}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{msg.attachment.size} • Tap to view</span>
                    </div>
                  </div>
                </div>
              )}

              {msg.sender === 'user' && (
                <div className="flex items-center gap-1 mt-1 text-[#b90064]">
                  <CheckCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Read</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Input Footer */}
      <footer className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 px-5 py-4 pb-safe z-50">
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <button className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 active:scale-90 cursor-pointer">
            <Paperclip size={18} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-12 bg-gray-50 border border-gray-100 rounded-full pl-5 pr-14 focus:outline-none focus:border-[#b90064] font-semibold text-xs text-[#1b1c1b] placeholder-gray-400 transition-all shadow-inner" 
              placeholder="Type your message..." 
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#b90064] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:scale-100" disabled={!inputText.trim()}>
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
