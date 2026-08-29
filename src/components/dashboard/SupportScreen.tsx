import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronRight,
  Wallet,
  Store,
  Gift,
  CheckCircle2,
  Bell,
  FileText,
  CreditCard,
  QrCode,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';
import BottomNav from './BottomNav';
import CancellationPolicyModal from '../CancellationPolicyModal';
import { supabase } from '../../lib/supabaseClient';
import { fetchMyTickets, createSupportTicket, type SupportTicket } from '../../lib/supportRepository';

const HELP_TOPICS = [
  { id: 'onboarding', label: 'Shop Onboarding', icon: Store },
  { id: 'kyc', label: 'KYC/Documents', icon: FileText },
  { id: 'qr', label: 'QR Qualification', icon: QrCode },
  { id: 'earnings', label: 'Earnings/Reversals', icon: Wallet },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
  { id: 'rewards', label: 'Reward Claims', icon: Gift },
];

type TabType = 'topics' | 'tickets' | 'new';

export default function SupportScreen({
  onNavigate,
  onBack,
  onViewTicket,
  onViewArticle
}: {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
  onViewTicket?: (id: string) => void;
  onViewArticle?: (id: string) => void;
}) {
  const [currentTab, setCurrentTab] = useState<TabType>('topics');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Real support-ticket state (supabase support_tickets)
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [category, setCategory] = useState('payouts');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [newTicketId, setNewTicketId] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Load the signed-in user's tickets once.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const rows = await fetchMyTickets(supabase, user.id);
        if (!cancelled) setTickets(rows);
      } catch {
        if (!cancelled) triggerToast('Could not load your tickets.');
      } finally {
        if (!cancelled) setTicketsLoaded(true);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setSubmitError('Supabase is not configured.');
      return;
    }
    if (!subject.trim()) {
      setSubmitError('Please provide a subject.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required.');
      const { id } = await createSupportTicket(supabase, {
        userId: user.id,
        subject,
        description,
        category: category || undefined,
        priority,
      });
      setNewTicketId(id);
      setShowSuccess(true);
      // Refresh the ticket list so the new ticket appears immediately.
      const rows = await fetchMyTickets(supabase, user.id);
      setTickets(rows);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-32 font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-110 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-xl shadow-sm flex justify-between items-center px-[var(--page-margin)] h-16 pt-[env(safe-area-inset-top)] border-b border-gray-100">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-50 text-[#b90064] hover:opacity-80 transition-opacity active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#b90064] tracking-tight">Help & Support</h1>
        <button 
          onClick={() => onNavigate?.('notifications')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:opacity-80 transition-opacity active:scale-95 cursor-pointer relative"
        >
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#b90064] rounded-full border border-white"></span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-[var(--page-margin)] pt-6 flex flex-col gap-6">
        
        {/* User Context Header */}
        <div className="flex items-center gap-4 bg-white rounded-[18px] p-4 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-full bg-[#FDE7F3] flex items-center justify-center text-[#b90064] font-bold text-lg border border-pink-100">
            RK
          </div>
          <div>
            <p className="text-base font-bold text-[#1b1c1b] tracking-tight">Growth Partner</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Help centre</p>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {(['topics', 'tickets', 'new'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                currentTab === tab 
                  ? 'border-b-2 border-[#b90064] text-[#b90064]' 
                  : 'text-gray-400'
              }`}
            >
              {tab === 'topics' ? 'Help Topics' : tab === 'tickets' ? 'My Tickets' : 'New Request'}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentTab === 'topics' && (
              <motion.div
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Select an area you need help with.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {HELP_TOPICS.map((topic) => (
                    <button 
                      key={topic.id}
                      onClick={() => onViewArticle?.(topic.id)}
                      className="bg-white rounded-[24px] p-5 flex flex-col items-center justify-center text-center gap-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-100 transition-all active:scale-95 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FDE7F3] flex items-center justify-center text-[#b90064] shadow-xs group-hover:scale-110 transition-transform">
                        <topic.icon size={24} />
                      </div>
                      <span className="text-[10px] font-black text-[#1b1c1b] uppercase tracking-wider group-hover:text-[#b90064] transition-colors">{topic.label}</span>
                    </button>
                  ))}
                </div>

                {/* Legal & Policies Section */}
                <div className="mt-4 pt-4 border-t border-gray-200/60">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">Legal & Policies</p>
                  <button
                    onClick={() => setIsPolicyModalOpen(true)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:border-pink-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#b90064]">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-[#1b1c1b] group-hover:text-[#b90064] transition-colors">Cancellation & Refund Policy</h4>
                        <p className="text-[11px] text-gray-500">View official platform guidelines and terms</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#b90064] transition-colors" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentTab === 'tickets' && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {ticketsLoaded && tickets.length === 0 && (
                  <p className="text-xs text-gray-500 font-medium">No support tickets yet. Create one from the New Request tab.</p>
                )}
                {tickets.map((ticket) => {
                  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
                  return (
                    <div 
                      key={ticket.id}
                      onClick={() => onViewTicket?.(ticket.id)}
                      className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col gap-3 transition-transform active:scale-[0.98] cursor-pointer hover:border-pink-100"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isResolved ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}></div>
                      
                      <div className="flex justify-between items-start pl-2">
                        <div className="space-y-1 text-left min-w-0">
                          <h3 className="text-sm font-bold text-[#1b1c1b] tracking-tight truncate">{ticket.subject}</h3>
                          <p className="text-xs font-medium text-gray-500 capitalize">{ticket.category || 'General'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isResolved 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="pl-2 pt-3 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <span>{ticket.id.slice(0, 8).toUpperCase()}</span>
                        <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {currentTab === 'new' && (
              <motion.div
                key="new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {!showSuccess ? (
                  <form onSubmit={handleFormSubmit} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Category</label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full h-14 rounded-2xl bg-gray-50 border-transparent focus:border-[#b90064] focus:ring-0 font-bold text-xs text-[#1b1c1b] px-4 appearance-none cursor-pointer"
                        >
                          <option value="rewards">Reward Claim</option>
                          <option value="payouts">Payout Issue</option>
                          <option value="tech">App Bug</option>
                          <option value="onboarding">Shop Onboarding</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                      <input 
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of issue"
                        className="w-full h-14 rounded-2xl bg-gray-50 border-transparent focus:border-[#b90064] focus:ring-0 font-bold text-xs text-[#1b1c1b] px-4"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Problem Description</label>
                      <textarea 
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed explanation..."
                        className="w-full rounded-2xl bg-gray-50 border-transparent focus:border-[#b90064] focus:ring-0 font-bold text-xs text-[#1b1c1b] p-4 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                      <div className="relative">
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full h-14 rounded-2xl bg-gray-50 border-transparent focus:border-[#b90064] focus:ring-0 font-bold text-xs text-[#1b1c1b] px-4 appearance-none cursor-pointer"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors group">
                      <UploadCloud size={32} className="text-gray-300 group-hover:text-[#b90064] transition-colors" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tap to upload files</p>
                    </div>

                    {submitError && (
                      <p className="text-[11px] font-bold text-rose-600 text-center -mt-2">{submitError}</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => triggerToast('Draft mode is not available here yet. Submit your request to save it.')}
                        className="flex-1 h-14 rounded-2xl bg-pink-50 text-[#b90064] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                      >
                        Save Draft
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-14 rounded-2xl bg-[#b90064] text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer shadow-md shadow-pink-200 flex items-center justify-center"
                      >
                        {isSubmitting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2 shadow-sm border border-emerald-100">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-[#1b1c1b] tracking-tight">Request Submitted</h2>
                    <p className="text-xs font-semibold text-gray-500 leading-relaxed max-w-[240px]">
                      Your ticket ID is <strong className="text-[#b90064]">{newTicketId ? newTicketId.slice(0, 8).toUpperCase() : '—'}</strong>. Our team will review this shortly.
                    </p>
                    <button 
                      onClick={() => { setShowSuccess(false); setCurrentTab('tickets'); }}
                      className="mt-4 w-full h-14 rounded-2xl bg-pink-50 text-[#b90064] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                    >
                      Track Request
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      <BottomNav onNavigate={onNavigate} currentPage="support" />

      {/* Cancellation Policy Modal */}
      <CancellationPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />

    </div>
  );
}

