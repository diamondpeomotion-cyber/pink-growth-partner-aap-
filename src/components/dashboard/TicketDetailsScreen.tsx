import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  fetchTicketById,
  fetchTicketMessages,
  createTicketMessage,
  type SupportTicket,
  type SupportMessage,
} from '../../lib/supportRepository';

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function TicketDetailsScreen({
  ticketId = '',
  onBack
}: {
  ticketId?: string;
  onBack: () => void;
}) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!supabase || !ticketId) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        setCurrentUserId(user.id);
        const [t, msgs] = await Promise.all([
          fetchTicketById(supabase, user.id, ticketId),
          fetchTicketMessages(supabase, ticketId),
        ]);
        if (cancelled) return;
        setTicket(t);
        setMessages(msgs);
        if (!t) setError('Ticket not found or you do not have access to it.');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load ticket.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [ticketId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!supabase || !ticketId || !text || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in required.');
      const msg = await createTicketMessage(supabase, { ticketId, userId: user.id, message: text });
      setMessages((prev) => [...prev, msg]);
      setReply('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm flex items-center justify-between px-5 h-16 border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors active:scale-95 text-[#b90064] cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[#b90064] flex-1 text-center tracking-tight truncate">
          {ticket ? ticket.subject : 'Ticket Details'}
        </h1>
        {ticket && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        )}
      </header>

      {error && (
        <section className="bg-white px-5 py-6 shadow-xs border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1b1c1b] tracking-tight">Ticket</h2>
          <p className="text-sm text-gray-500 mt-1">
            {ticketId ? `Reference ${ticketId}` : 'No ticket is selected.'}
          </p>
          <p className="text-xs text-rose-500 mt-3 font-semibold">{error}</p>
        </section>
      )}

      {!error && (
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-[var(--page-margin)] py-6 space-y-6">
          {ticket && (
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                {ticket.category && <span className="bg-pink-50 text-[#b90064] px-2 py-0.5 rounded-full">{ticket.category}</span>}
                <span className="bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">Priority: {ticket.priority}</span>
                {ticket.createdAt && (
                  <span className="text-gray-400">
                    Opened {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {ticket.description && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3">{ticket.description}</p>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider px-1 flex items-center gap-1.5">
              <MessageCircle size={14} className="text-primary" /> Conversation
            </h3>
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 font-semibold bg-white rounded-2xl p-5 border border-gray-100 text-center">
                No messages yet. Start the conversation below.
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs max-w-[85%] ${
                      m.senderUserId === currentUserId ? 'ml-auto bg-pink-50/40 border-pink-100' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-700 leading-relaxed">{m.message}</p>
                    {m.createdAt && (
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2">
                        {new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <form onSubmit={handleSend} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-end gap-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a message…"
              rows={2}
              className="flex-1 resize-none bg-gray-50 border-transparent focus:ring-2 focus:ring-[#b90064]/20 text-sm font-semibold text-[#1b1c1b] p-3 rounded-2xl"
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 hover:bg-pink-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              aria-label="Send message"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </main>
      )}
    </div>
  );
}
