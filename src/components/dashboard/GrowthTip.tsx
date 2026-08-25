import { useState } from 'react';
import { Sparkles, Lightbulb, TrendingUp, Users, Quote } from 'lucide-react';
import { motion } from 'motion/react';

const GROWTH_TIPS = [
  {
    id: 1,
    title: "Customer Referrals",
    content: "Customer referrals are your cheapest marketing. Ask your best clients for a review!",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: 2,
    title: "Service Quality",
    content: "Consistency in service quality builds long-term trust. Keep those standards high.",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50"
  },
  {
    id: 3,
    title: "Digital Presence",
    content: "Social media is the new storefront. Update your Instagram weekly with your best work.",
    icon: Lightbulb,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    id: 4,
    title: "Retention Secret",
    content: "Personalized greetings can increase customer retention by up to 20%.",
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  {
    id: 5,
    title: "Revenue Boost",
    content: "Offering small add-on services can boost your daily revenue significantly.",
    icon: TrendingUp,
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  {
    id: 6,
    title: "First Impressions",
    content: "Keep your shop clean and well-lit; first impressions last forever.",
    icon: Sparkles,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  }
];

export default function GrowthTip() {
  // Pick the random tip once during lazy state initialisation instead of in an
  // effect. Doing it in an effect caused an extra render pass and made the tip
  // visibly "flip" from the first entry to the random one on every mount.
  const [tip] = useState(() => GROWTH_TIPS[Math.floor(Math.random() * GROWTH_TIPS.length)]);

  const Icon = tip.icon;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Quote size={80} className="text-gray-900" />
      </div>

      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${tip.bgColor} ${tip.color} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Daily Growth Tip</span>
            <div className="h-1 w-1 rounded-full bg-gray-300"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tip.title}</span>
          </div>
          <p className="text-sm font-bold text-gray-800 leading-relaxed pr-6">
            "{tip.content}"
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-50">
        <span className="text-[10px] font-bold text-gray-400">General practice tip — not a live usage count</span>
      </div>
    </motion.section>
  );
}
