import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  UploadCloud,
  ChevronDown,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface NewTicketScreenProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export default function NewTicketScreen({ onBack, onNavigate }: NewTicketScreenProps) {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen overflow-x-hidden flex flex-col font-sans">
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-16 w-full">
          <button 
            onClick={onBack}
            aria-label="Go back" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition-colors text-[#b90064] cursor-pointer active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-[#b90064] truncate mx-4 flex-1 tracking-tight">New Ticket</h1>
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 shadow-sm">
            <img 
              alt="Partner Profile" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy6hBXYrmOKccJ8RjKAe7kpKClrr-9OypinMvvOA-LCNcjimH7jJbcj3DieYl_wz-RVBdcif-aDklQv8RYt45qr3Sk0pdq2P-dZ8gMvDB_EMjnyc3zJRXwFW6yvJDFjX898GvU4gXDlzJFGaij2t5iaE6hIodnoEnagr4jCr-arF0_Dsj-IEp0PusKkFAW92STh-4NU3yqtbMYNePhl4Jmq1979DzQnvLpt0U2xWQUS0B5eWRPw90S" 
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-[var(--page-margin)] py-6 space-y-6">
        {/* Page Header (Desktop Context) */}
        <div className="hidden md:block mb-8">
          <button 
            onClick={onBack}
            className="inline-flex items-center text-[#b90064] hover:opacity-80 transition-opacity text-xs font-bold mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to Support Dashboard
          </button>
          <h2 className="text-2xl font-bold text-[#1b1c1b] tracking-tight">Submit a New Support Ticket</h2>
          <p className="text-sm text-[#5a3f47] mt-2 font-medium">Describe your issue in detail below. Our partner success team typically responds within 2 hours.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[18px] shadow-sm border border-gray-100 p-6 relative overflow-hidden">
          {/* Decorative Status Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#b90064]"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1b]" htmlFor="category">Issue Category</label>
              <div className="relative">
                <select 
                  id="category" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-gray-50 border-transparent text-[#1b1c1b] text-sm font-semibold px-4 appearance-none focus:ring-2 focus:ring-[#b90064]/20 transition-all outline-hidden cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a category...</option>
                  <option value="payouts">Payouts & Billing</option>
                  <option value="onboarding">Shop Onboarding</option>
                  <option value="rewards">Partner Rewards</option>
                  <option value="tech">Technical Issue</option>
                  <option value="other">Other Inquiry</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#b90064]">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1b]" htmlFor="subject">Subject</label>
              <input 
                type="text" 
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-14 rounded-2xl bg-gray-50 border-transparent text-[#1b1c1b] text-sm font-semibold px-4 focus:ring-2 focus:ring-[#b90064]/20 transition-all outline-hidden" 
                placeholder="Brief summary of the issue"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1b]" htmlFor="description">Description</label>
              <textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[120px] rounded-2xl bg-gray-50 border-transparent text-[#1b1c1b] text-sm font-semibold p-4 focus:ring-2 focus:ring-[#b90064]/20 transition-all outline-hidden resize-y" 
                placeholder="Please provide detailed information..."
                required
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1b]">Attachments</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-6 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-[#FDE7F3] text-[#b90064] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud size={24} />
                </div>
                <p className="text-xs font-bold text-[#5a3f47]">Click or drag files to upload</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">PNG, JPG, PDF (Max 5MB)</p>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1b]">Priority Level</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'low', label: 'Low', icon: Clock, color: 'text-emerald-500' },
                  { id: 'medium', label: 'Medium', icon: Zap, color: 'text-amber-500' },
                  { id: 'high', label: 'High', icon: AlertTriangle, color: 'text-red-500' }
                ].map((p) => (
                  <label 
                    key={p.id}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      priority === p.id 
                        ? 'border-[#b90064] bg-[#FDE7F3] text-[#b90064] shadow-sm' 
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-[#5a3f47]'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p.id} 
                      className="sr-only"
                      checked={priority === p.id}
                      onChange={() => setPriority(p.id)}
                    />
                    <p.icon size={20} className={`mb-1 ${priority === p.id ? 'text-[#b90064]' : p.color}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting || showSuccess}
                className="w-full h-14 rounded-2xl bg-[#b90064] text-white text-sm font-bold shadow-lg hover:bg-pink-800 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : showSuccess ? (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Ticket Submitted</span>
                  </>
                ) : (
                  <span>Submit Ticket</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-[#fcf9f8] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h2 className="text-2xl font-bold text-[#1b1c1b] tracking-tight mb-2">Ticket Submitted!</h2>
            <p className="text-[#5a3f47] font-medium max-w-xs">Your support request has been received. We'll update you shortly.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
