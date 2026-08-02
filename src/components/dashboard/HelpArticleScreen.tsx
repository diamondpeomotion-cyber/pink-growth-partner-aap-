import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
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

interface ArticleStep {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface ArticleContent {
  title: string;
  description: string;
  steps: ArticleStep[];
}

/**
 * Knowledge-base content keyed by the topic id emitted from SupportScreen.
 * Previously a single hard-coded article was rendered for every topic, so all
 * six help cards opened the same "How do I verify a shop?" page.
 */
const ARTICLES: Record<string, ArticleContent> = {
  'verify-shop': {
    title: 'How do I verify a shop?',
    description:
      'A complete guide to successfully onboarding and verifying a new partner salon on the Nexora platform.',
    steps: [
      { icon: Store, title: '1. Onboard Shop', desc: 'Enter the primary salon details, including name, location, and owner contact information into the partner portal.' },
      { icon: ClipboardCheck, title: '2. Complete KYC', desc: 'Upload the required business registration documents and owner identification for our compliance team to review.' },
      { icon: QrCode, title: '3. Nexora QR Activation', desc: "Generate and link a unique Nexora payment QR code to the salon's verified account to enable direct payouts." },
      { icon: Calendar, title: '4. 15-day Qualification Period', desc: 'The shop will undergo a 15-day monitoring period to ensure transaction volume and service quality meet Nexora standards.' },
    ],
  },
  onboarding: {
    title: 'Shop onboarding, step by step',
    description:
      'Everything you need to collect before adding a salon so the registration clears review on the first attempt.',
    steps: [
      { icon: Store, title: '1. Owner details', desc: 'Capture the owner name, mobile number and preferred language. The mobile number must be OTP verified before you continue.' },
      { icon: ClipboardCheck, title: '2. Shop & location', desc: 'Add the shop name, category and the full address with pincode. An accurate pin drop speeds up field verification.' },
      { icon: Calendar, title: '3. Business details', desc: 'Record opening hours, weekly off, staff count and the service menu with starting prices.' },
      { icon: QrCode, title: '4. Submit for review', desc: 'Upload the storefront photo and submit. Most shops are reviewed within 48 working hours.' },
    ],
  },
  kyc: {
    title: 'KYC & document requirements',
    description:
      'Which documents are mandatory, the accepted formats, and the most common reasons an upload gets rejected.',
    steps: [
      { icon: ClipboardCheck, title: 'Mandatory documents', desc: 'Aadhaar (front), PAN card and a clear shop-front photo showing the signage are required for every shop.' },
      { icon: Store, title: 'Optional documents', desc: 'Aadhaar back and Voter ID help resolve address mismatches faster but are not blocking.' },
      { icon: QrCode, title: 'File rules', desc: 'JPG, PNG or PDF up to 5 MB per file. All four corners must be visible and the text must be readable.' },
      { icon: Calendar, title: 'Common rejections', desc: 'Blurred photos, cropped edges, glare over the ID number, or a name that does not match the bank account.' },
    ],
  },
  qr: {
    title: 'QR qualification explained',
    description:
      'How a shop becomes "qualifying" and what counts towards your reward milestones.',
    steps: [
      { icon: QrCode, title: 'Valid transactions only', desc: 'Only successful payments made through the Nexora QR count. Cash and personal QR payments are excluded.' },
      { icon: Calendar, title: 'Daily target', desc: 'A shop must record at least ₹1,000 of verified Nexora QR volume in a day for that day to pass.' },
      { icon: ClipboardCheck, title: '15-day window', desc: 'The shop needs to pass the daily target on the majority of days inside the 15-day qualification window.' },
      { icon: Store, title: 'Staying qualified', desc: 'Qualification is re-checked monthly. A shop that stops transacting drops out of your qualifying count.' },
    ],
  },
  earnings: {
    title: 'Earnings & reversals',
    description:
      'How commission is calculated, when it is credited, and why an amount can be reversed.',
    steps: [
      { icon: QrCode, title: 'How it is calculated', desc: 'Commission accrues on verified Nexora QR volume from each of your qualifying shops.' },
      { icon: Calendar, title: 'When it appears', desc: 'Verified transactions move into "Available earnings" after the standard settlement check, usually the next working day.' },
      { icon: ClipboardCheck, title: 'Why reversals happen', desc: 'Refunded, disputed or fraudulent transactions are deducted from your ledger with a matching reversal entry.' },
      { icon: Store, title: 'Tracking it', desc: 'Open Earnings → shop ledger to see every credit and reversal line item for a single shop.' },
    ],
  },
  payouts: {
    title: 'Payouts & bank settlement',
    description:
      'Payout cycles, minimum thresholds and what to do when a transfer fails.',
    steps: [
      { icon: Calendar, title: 'Payout cycle', desc: 'Available earnings are settled on a 7-day cycle to the bank account linked in your profile.' },
      { icon: ClipboardCheck, title: 'Before your first payout', desc: 'Your PAN and bank account must be verified, and the account holder name must match your KYC name.' },
      { icon: QrCode, title: 'Tracking a transfer', desc: 'Every settlement gets a UTR reference. Find it under Payouts → payout history.' },
      { icon: Store, title: 'If a payout fails', desc: 'Failed transfers return to your available balance within 3 working days. Correct the bank details and it retries next cycle.' },
    ],
  },
  rewards: {
    title: 'Reward claims',
    description:
      'How milestone rewards unlock and what happens after you submit a claim.',
    steps: [
      { icon: Store, title: 'Milestones', desc: 'Rewards unlock at 25, 50, 100 and 250 qualifying shops. Only currently qualifying shops count.' },
      { icon: ClipboardCheck, title: 'Claiming', desc: 'Once a milestone unlocks, open Rewards, pick your reward, and submit the claim. You get a claim ID immediately.' },
      { icon: Calendar, title: 'Review period', desc: 'Claims go through a 72-hour security audit before dispatch or credit is scheduled.' },
      { icon: QrCode, title: 'Keep KYC current', desc: 'Physical rewards ship to your registered address, so make sure your profile and PAN details are up to date.' },
    ],
  },
};

export default function HelpArticleScreen({ onBack, articleId = 'verify-shop' }: HelpArticleScreenProps) {
  const article = ARTICLES[articleId] ?? ARTICLES['verify-shop'];

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] min-h-screen overflow-x-hidden pb-24 antialiased font-sans">
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
