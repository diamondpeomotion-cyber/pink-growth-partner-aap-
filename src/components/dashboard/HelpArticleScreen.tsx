import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  User,
  Store,
  ClipboardCheck,
  QrCode,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ChevronRight
} from 'lucide-react';

interface HelpArticleScreenProps {
  onBack: () => void;
  articleId?: string;
}

export default function HelpArticleScreen({ onBack, articleId = 'verify-shop' }: HelpArticleScreenProps) {
  // In a real app, you'd fetch article data based on articleId
  const article = {
    title: 'How do I verify a shop?',
    description: 'A complete guide to successfully onboarding and verifying a new partner salon on the Nexora platform.',
    steps: [
      {
        icon: Store,
        title: '1. Onboard Shop',
        desc: 'Enter the primary salon details, including name, location, and owner contact information into the partner portal.'
      },
      {
        icon: ClipboardCheck,
        title: '2. Complete KYC',
        desc: 'Upload the required business registration documents and owner identification for our compliance team to review.'
      },
      {
        icon: QrCode,
        title: '3. Nexora QR Activation',
        desc: "Generate and link a unique Nexora payment QR code to the salon's verified account to enable direct payouts."
      },
      {
        icon: Calendar,
        title: '4. 15-day Qualification Period',
        desc: 'The shop will undergo a 15-day monitoring period to ensure transaction volume and service quality meet Nexora standards.'
      }
    ]
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen pb-24 antialiased font-sans">
      {/* TopAppBar */}
      <header className="sticky top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-16 w-full">
          <button 
            onClick={onBack}
            className="text-[#b90064] hover:opacity-80 transition-all active:scale-95 cursor-pointer p-2 -ml-2"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-[#b90064] tracking-tight">Help & Support</h1>
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
            <User size={20} className="text-[#5a3f47]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 py-8 flex flex-col gap-8 max-w-2xl mx-auto">
        {/* Article Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <span className="text-[10px] font-black text-[#b90064] tracking-[0.2em] uppercase">Knowledge Base</span>
          <h2 className="text-2xl font-bold text-[#1b1c1b] leading-tight tracking-tight">{article.title}</h2>
          <p className="text-sm font-medium text-[#5a3f47] leading-relaxed mt-1">
            {article.description}
          </p>
        </motion.div>

        {/* Step-by-Step Guide Bento */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] p-4 flex flex-col gap-6"
        >
          {article.steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex gap-4 items-start p-2 rounded-2xl hover:bg-gray-50 transition-colors group">
                <div className="w-11 h-11 rounded-full bg-[#FDE7F3] flex items-center justify-center shrink-0 shadow-xs">
                  <step.icon size={20} className="text-[#b90064]" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-[#1b1c1b] group-hover:text-[#b90064] transition-colors">{step.title}</h3>
                  <p className="text-xs font-medium text-[#5a3f47] leading-relaxed">{step.desc}</p>
                </div>
              </div>
              {idx < article.steps.length - 1 && (
                <hr className="border-t border-gray-50 ml-14" />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Feedback Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-[20px] p-5 flex flex-col items-center justify-center gap-4 border border-gray-100 mt-2"
        >
          <h4 className="text-sm font-bold text-[#1b1c1b]">Was this article helpful?</h4>
          <div className="flex gap-4 w-full">
            <button className="flex-1 px-6 py-3 rounded-[16px] bg-white border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] text-xs font-bold text-[#1b1c1b] hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <ThumbsUp size={16} /> Yes
            </button>
            <button className="flex-1 px-6 py-3 rounded-[16px] bg-white border border-gray-100 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] text-xs font-bold text-[#1b1c1b] hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <ThumbsDown size={16} /> No
            </button>
          </div>
        </motion.div>

        {/* Related Articles */}
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-base font-bold text-[#1b1c1b] tracking-tight">Related Articles</h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              'Understanding KYC Requirements',
              'Troubleshooting QR Activation'
            ].map((related, idx) => (
              <button 
                key={idx}
                className="bg-white border border-gray-100 rounded-[18px] p-4 shadow-sm hover:shadow-md hover:border-pink-100 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <span className="text-xs font-bold text-[#1b1c1b] group-hover:text-[#b90064] transition-colors">{related}</span>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#b90064] transition-all" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
