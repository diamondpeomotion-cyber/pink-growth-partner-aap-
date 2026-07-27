import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

export default function CelebrationOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-page-margin-mobile"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[28px] p-8 w-full max-w-sm text-center shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#5a3f47] hover:text-[#1b1c1b]">
          <X size={24} />
        </button>
        <div className="w-20 h-20 bg-[#fde7f3] text-[#b90064] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-bold text-[#1b1c1b] mb-2">Target Achieved!</h2>
        <p className="text-[15px] text-[#5a3f47] mb-6">Congratulations! You've unlocked the <span className="font-semibold text-[#1b1c1b]">Electric Scooter</span> reward.</p>
        <button onClick={onClose} className="w-full h-14 bg-[#e6007e] text-white font-semibold text-sm rounded-[16px] hover:bg-[#b80663] transition-colors shadow-md shadow-[#e6007e]/20">
          Claim My Reward
        </button>
      </motion.div>
    </motion.div>
  );
}
