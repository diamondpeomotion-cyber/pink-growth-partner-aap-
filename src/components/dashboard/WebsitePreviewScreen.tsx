import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Globe, 
  Smartphone, 
  Monitor, 
  Sparkles, 
  Star, 
  MapPin, 
  Share2, 
  ExternalLink,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import CancellationPolicyModal from '../CancellationPolicyModal';

export default function WebsitePreviewScreen({ onBack }: { onBack: () => void }) {
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('Bridal HD Makeup & Hair');
  const [customerName, setCustomerName] = useState('Priya Sharma');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [subdomain] = useState('glowbeauty');
  const [primaryColor] = useState('#b90064');

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://${subdomain}.nexora.shop`);
      alert(`Storefront link copied to clipboard: https://${subdomain}.nexora.shop`);
    } else {
      alert(`Storefront URL: https://${subdomain}.nexora.shop`);
    }
  };

  const handleOpenBooking = (serviceName?: string) => {
    if (serviceName) setSelectedService(serviceName);
    setIsBookingModalOpen(true);
    setPolicyAgreed(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyAgreed) return;
    setIsBookingModalOpen(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1b] flex flex-col w-full shadow-lg border-x border-gray-100">
      {/* Top Navigation / Controls Bar */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between px-[--page-margin] h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
                Website Live Preview <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">Active</span>
              </h1>
              <p className="text-xs text-gray-500">https://{subdomain}.nexora.shop</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="bg-gray-100 p-1 rounded-xl hidden sm:flex items-center gap-1">
              <button 
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${previewDevice === 'mobile' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Smartphone size={16} /> Mobile View
              </button>
              <button 
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${previewDevice === 'desktop' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Monitor size={16} /> Desktop View
              </button>
            </div>

            <button 
              onClick={handleShare}
              className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={14} /> Share Link
            </button>
          </div>
        </div>
      </header>

      {/* Main Preview Frame Area */}
      <main className="flex-1 bg-gray-100 p-4 md:p-8 flex items-center justify-center overflow-auto">
        <div className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${previewDevice === 'mobile' ? 'w-full h-[780px] rounded-[44px] border-[10px] border-gray-900' : 'w-full h-[80vh] rounded-2xl border border-gray-200'}`}>
          
          {/* Simulated Web Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: primaryColor }}>
                G
              </div>
              <span className="font-extrabold text-gray-900 text-sm tracking-tight">Glow Beauty Parlour</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
              <span className="hidden sm:inline cursor-pointer hover:text-primary">Services</span>
              <span className="hidden sm:inline cursor-pointer hover:text-primary">Stylists</span>
              <span className="hidden sm:inline cursor-pointer hover:text-primary">About</span>
              <button 
                onClick={() => handleOpenBooking()}
                className="text-white px-3.5 py-1.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Book Appointment
              </button>
            </div>
          </div>

          {/* Simulated Web Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {bookingSuccess && (
              <div className="bg-emerald-500 text-white p-3 text-center text-xs font-bold sticky top-0 z-30 shadow-md animate-fade-in flex items-center justify-center gap-2">
                <CheckCircle2 size={16} /> Appointment booked successfully! Owner notified on WhatsApp.
              </div>
            )}

            {/* Hero Section */}
            <div className="relative p-6 md:p-12 text-white flex flex-col items-center justify-center text-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1b1c1b)` }}>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                <Sparkles size={12} /> Nexora Verified
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner">
                <Sparkles size={30} className="text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">Glow Beauty Parlour</h1>
              <p className="text-xs md:text-sm text-white/90 max-w-screen-md mb-6 leading-relaxed">
                Expert bridal makeup, hair styling, advanced facials & luxury skin care treatments in Vaishali Nagar, Jaipur.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 bg-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                  <Star size={14} className="text-amber-300 fill-amber-300" /> 4.9 (420+ reviews)
                </span>
                <span className="flex items-center gap-1 bg-white/15 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                  <MapPin size={14} /> Vaishali Nagar, Jaipur
                </span>
              </div>
            </div>

            {/* Services Listing */}
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-base md:text-lg">Featured Services</h3>
                <span className="text-xs font-semibold cursor-pointer hover:underline" style={{ color: primaryColor }}>View All (12)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Bridal HD Makeup & Hair', price: '₹7,499', time: '120 mins', img: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80', desc: 'Complete premium bridal makeup with airbrush finish & designer hair styling.' },
                  { name: 'Gold Facial & Skin Glow', price: '₹1,499', time: '60 mins', img: 'https://images.unsplash.com/photo-1512290900672-17730e2f3d99?auto=format&fit=crop&w=400&q=80', desc: 'Rejuvenating 24k gold leaf facial for instant radiance and deep cleansing.' },
                  { name: 'Keratin Hair Spa & Treatment', price: '₹999', time: '45 mins', img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=400&q=80', desc: 'Deep nourishing treatment for frizzy and damaged hair.' },
                  { name: 'Luxury Manicure & Pedicure', price: '₹799', time: '50 mins', img: 'https://images.unsplash.com/photo-1632345031435-8727f6c97d34?auto=format&fit=crop&w=400&q=80', desc: 'Relaxing hand and foot spa with exfoliating scrub and massage.' },
                ].map((svc, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3.5 mb-3">
                      <img src={svc.img} alt={svc.name} className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 leading-snug">{svc.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{svc.desc}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><Calendar size={12} /> {svc.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="font-extrabold text-base" style={{ color: primaryColor }}>{svc.price}</span>
                      <button 
                        onClick={() => handleOpenBooking(svc.name)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white p-6 md:p-8 border-t border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Customer Reviews</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400" />)}
                  </div>
                  <p className="text-xs text-gray-700 italic">"Amazing bridal makeup service! Rajesh and team made my wedding day extremely special. Highly recommended."</p>
                  <p className="text-[11px] font-bold text-gray-900">— Priya Sharma</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400" />)}
                  </div>
                  <p className="text-xs text-gray-700 italic">"Very clean parlour and polite staff. The gold facial gave my skin an unbelievable glow!"</p>
                  <p className="text-[11px] font-bold text-gray-900">— Neha Agarwal</p>
                </div>
              </div>
            </div>

            {/* Store Footer */}
            <div className="bg-gray-900 text-white p-6 text-center space-y-2">
              <p className="text-xs font-bold">Powered by Nexora Merchant Storefront Engine</p>
              <p className="text-[11px] text-gray-400">© 2026 Glow Beauty Parlour. All rights reserved.</p>
            </div>

          </div>
        </div>
      </main>

      {/* Customer Booking Modal with Mandatory Policy Checkbox */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-screen-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Confirm Appointment</h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Selected Service</label>
                <input type="text" disabled value={selectedService} className="w-full bg-gray-100 text-gray-800 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-primary focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input 
                  type="text" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-primary focus:outline-none" 
                />
              </div>

              {/* Mandatory Policy Checkbox */}
              <div className="bg-pink-50/60 p-3.5 rounded-2xl border border-pink-100">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={policyAgreed}
                    onChange={(e) => setPolicyAgreed(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-gray-800 leading-snug">
                    “मैंने Cancellation & Refund Policy पढ़ ली है और मैं इससे सहमत हूँ।”{' '}
                    <button 
                      type="button" 
                      onClick={() => setIsPolicyModalOpen(true)}
                      className="text-primary font-bold underline hover:opacity-80 inline"
                    >
                      (Read Policy)
                    </button>
                  </span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={!policyAgreed}
                className={`w-full py-3 rounded-xl text-xs font-bold shadow-md transition-all ${
                  policyAgreed 
                    ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Confirm & Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Policy Modal */}
      <CancellationPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />
    </div>
  );
}

