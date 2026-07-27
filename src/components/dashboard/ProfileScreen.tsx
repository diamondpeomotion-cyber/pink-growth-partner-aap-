import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  Shield,
  CreditCard,
  Award,
  Settings,
  Bell,
  CheckCircle,
  Lock,
  Edit,
  Trash2,
  LogOut,
  Pause,
  ChevronRight,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Download,
  Check,
  Sparkles,
  Smartphone,
  Share2,
  QrCode,
  Camera
} from 'lucide-react';
import BottomNav from './BottomNav';

export default function ProfileScreen({
  onBack,
  onNavigate,
  onLogout
}: {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
}) {
  // Load saved profile details, fallback to original details
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('nexora_partner_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return {
      name: 'Rajesh Kumar',
      dob: '1988-08-14', // ISO date for input ease
      mobile: '+91 98321 45678',
      email: 'r.kumar@example.com',
      address: 'Ajmer Road, Jaipur, Rajasthan, 302006',
      alternateMobile: '',
      profileImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAeigYb6tOYh_NW0aJ-wsYDyIsuZyXV98e49VD8omzpJ2muriuTeHAR_-2EkRvjduZZugEA3cl-D-oph6IwNrFVDCR87nbdXHqaASveZ2kWPgPSzMMcTkiW437g7PSpFqV2mOOgwz-EqmErgMeEYFzxswmGlBWsxnD6OVyA4zzLTuAfEocBnTEsFnkYu0JU2jhjOVKGnoRtUgVh5s8i7tL1JYpjH6h_2Wk4snbU_fkcS6UeC7PeAGG'
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updated = {
          ...profile,
          profileImage: base64String
        };
        setProfile(updated);
        localStorage.setItem('nexora_partner_profile', JSON.stringify(updated));
        triggerToast('Profile photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoSelect = () => {
    fileInputRef.current?.click();
  };

  // Keep track of active modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isIdOpen, setIsIdOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [kycDoc, setKycDoc] = useState<'pan' | 'aadhaar' | null>(null);

  // Local state for edit forms
  const [editName, setEditName] = useState(profile.name);
  const [editDob, setEditDob] = useState(profile.dob);
  const [editMobile, setEditMobile] = useState(profile.mobile);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editAddress, setEditAddress] = useState(profile.address);
  
  // Local state for alternate phone form
  const [altPhone, setAltPhone] = useState(profile.alternateMobile);
  const [altPhoneError, setAltPhoneError] = useState('');

  // Status banners / toast states
  const [toastMessage, setToastMessage] = useState('');

  // Update profile in localStorage and local state
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editName,
      dob: editDob,
      mobile: editMobile,
      email: editEmail,
      address: editAddress
    };
    setProfile(updated);
    localStorage.setItem('nexora_partner_profile', JSON.stringify(updated));
    setIsEditOpen(false);
    triggerToast('Profile updated successfully!');
  };

  const handleSaveAltPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!altPhone || altPhone.trim().length < 10) {
      setAltPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const updated = {
      ...profile,
      alternateMobile: altPhone
    };
    setProfile(updated);
    localStorage.setItem('nexora_partner_profile', JSON.stringify(updated));
    setIsCompleteOpen(false);
    triggerToast('Alternate phone added! Profile is now 100% complete.');
  };

  const handleRemoveAltPhone = () => {
    const updated = {
      ...profile,
      alternateMobile: ''
    };
    setAltPhone('');
    setProfile(updated);
    localStorage.setItem('nexora_partner_profile', JSON.stringify(updated));
    triggerToast('Alternate mobile removed.');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Helper to format DOB nicely
  const formatDateString = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return isoDate;
    }
  };

  // Derived variables
  const hasAltPhone = !!profile.alternateMobile;
  const progressPercent = hasAltPhone ? 100 : 90;

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased pt-16 pb-24 md:pb-8 min-h-screen overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-110 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 h-16 max-w-full bg-white/75 backdrop-blur-md shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hidden md:flex">
        <div className="font-bold text-xl text-[#b90064] tracking-tight cursor-pointer" onClick={() => onNavigate?.('dashboard')}>Nexora</div>
        <div className="flex items-center gap-4">
          <button aria-label="Settings" onClick={() => onNavigate?.('account-settings')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
            <Settings size={20} className="text-[#5a3f47]" />
          </button>
          <button aria-label="Notifications" onClick={() => onNavigate?.('notifications')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative cursor-pointer">
            <Bell size={20} className="text-[#5a3f47]" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b90064] rounded-full border border-white"></span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer" onClick={() => onNavigate?.('profile')}>
            <img alt="Salon Owner Profile" className="w-full h-full object-cover" src={profile.profileImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuAy6hBXYrmOKccJ8RjKAe7kpKClrr-9OypinMvvOA-LCNcjimH7jJbcj3DieYl_wz-RVBdcif-aDklQv8RYt45qr3Sk0pdq2P-dZ8gMvDB_EMjnyc3zJRXwFW6yvJDFjX898GvU4gXDlzJFGaij2t5iaE6hIodnoEnagr4jCr-arF0_Dsj-IEp0PusKkFAW92STh-4NU3yqtbMYNePhl4Jmq1979DzQnvLpt0U2xWQUS0B5eWRPw90S"} />
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-white/75 backdrop-blur-md shadow-sm md:hidden border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-[#b90064] cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-[#1b1c1b]">Profile</h1>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Settings" onClick={() => onNavigate?.('account-settings')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
            <Settings size={20} className="text-[#5a3f47]" />
          </button>
          <button aria-label="Notifications" onClick={() => onNavigate?.('notifications')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors relative cursor-pointer">
            <Bell size={20} className="text-[#5a3f47]" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b90064] rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-5 md:px-10 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Summary & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Partner Profile Summary */}
            <section className="bg-white rounded-[18px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden border border-gray-100">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2E7D32]"></div>
              <div className="flex flex-col items-center text-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={triggerPhotoSelect}
                  className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FDE7F3] mb-3 relative group cursor-pointer shadow-sm hover:opacity-95 transition-all"
                  title="Click to update profile photo"
                >
                  <img alt={profile.name} className="w-full h-full object-cover" src={profile.profileImage} />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center transition-opacity">
                    <div className="bg-primary/90 text-white p-1.5 rounded-full shadow-md">
                      <Camera size={16} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={triggerPhotoSelect}
                  className="text-xs font-bold text-primary hover:underline mb-2 cursor-pointer flex items-center gap-1"
                >
                  <Camera size={12} /> Change Profile Photo
                </button>
                <h2 className="text-xl font-bold text-[#1b1c1b] mb-1">{profile.name}</h2>
                <p className="text-sm text-[#5a3f47] mb-2 font-medium">Growth Partner</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#2E7D32] text-xs font-bold mb-6">
                  <CheckCircle size={14} className="text-emerald-600" />
                  Active (Verified KYC)
                </div>
                <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-gray-100 pt-4 mb-6">
                  <div>
                    <p className="text-[11px] text-[#5a3f47] uppercase tracking-wider mb-1 font-bold">Partner ID</p>
                    <p className="text-[13px] text-[#1b1c1b] font-extrabold">GP-JPR-1024</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#5a3f47] uppercase tracking-wider mb-1 font-bold">Territory</p>
                    <p className="text-[13px] text-[#1b1c1b] font-extrabold">Jaipur District</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => {
                      setEditName(profile.name);
                      setEditDob(profile.dob);
                      setEditMobile(profile.mobile);
                      setEditEmail(profile.email);
                      setEditAddress(profile.address);
                      setIsEditOpen(true);
                    }} 
                    className="flex-1 bg-[#b90064] text-white text-[13px] font-bold h-12 rounded-[16px] flex items-center justify-center hover:opacity-95 transition-opacity cursor-pointer shadow-xs active:scale-98"
                  >
                    Edit Profile
                  </button>
                  <button 
                    onClick={() => setIsIdOpen(true)} 
                    className="flex-1 bg-[#FDE7F3] text-[#b90064] text-[13px] font-bold h-12 rounded-[16px] flex items-center justify-center hover:opacity-95 transition-opacity cursor-pointer active:scale-98"
                  >
                    View ID
                  </button>
                </div>
              </div>
            </section>

            {/* Profile Completion */}
            <section className="bg-white rounded-[18px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-[18px] font-bold text-[#1b1c1b]">Profile Progress</h3>
                <span className="text-xl font-black text-[#b90064]">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-[#b90064] rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#2E7D32] fill-[#2E7D32]/10" />
                  <span className="text-xs font-semibold text-[#1b1c1b]">Personal &amp; KYC verified</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#2E7D32] fill-[#2E7D32]/10" />
                  <span className="text-xs font-semibold text-[#1b1c1b]">Payout Account linked</span>
                </li>
                <li className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    {hasAltPhone ? (
                      <CheckCircle size={18} className="text-[#2E7D32] fill-[#2E7D32]/10" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300"></div>
                    )}
                    <span className={`text-xs font-semibold ${hasAltPhone ? 'text-[#1b1c1b]' : 'text-[#5a3f47]'}`}>
                      Add Alternate Mobile {hasAltPhone && `(${profile.alternateMobile})`}
                    </span>
                  </div>
                  {hasAltPhone && (
                    <button 
                      onClick={handleRemoveAltPhone} 
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </li>
              </ul>
              {!hasAltPhone && (
                <button 
                  onClick={() => {
                    setAltPhone(profile.alternateMobile);
                    setAltPhoneError('');
                    setIsCompleteOpen(true);
                  }} 
                  className="w-full bg-[#FDE7F3] text-[#b90064] text-[13px] font-bold h-12 rounded-[16px] flex items-center justify-center hover:opacity-95 transition-opacity cursor-pointer shadow-xs active:scale-98"
                >
                  Complete Profile
                </button>
              )}
            </section>

            {/* Account Actions */}
            <section className="bg-white rounded-[18px] overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 divide-y divide-gray-100">
              <button 
                onClick={() => setIsPauseOpen(true)} 
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#ED6C02] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Pause size={18} />
                  <span className="text-sm font-bold">Pause Account</span>
                </div>
                <ChevronRight size={18} />
              </button>
              <button 
                onClick={() => setIsCloseOpen(true)} 
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#BA1A1A] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trash2 size={18} />
                  <span className="text-sm font-bold">Close Account</span>
                </div>
                <ChevronRight size={18} />
              </button>
              <button 
                onClick={onLogout} 
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-[#5a3f47] text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span className="text-sm font-bold">Log Out</span>
                </div>
              </button>
            </section>
          </div>

          {/* Right Column: Details & Settings */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Personal Details */}
            <section className="bg-white rounded-[18px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[18px] font-bold text-[#1b1c1b]">Personal Details</h3>
                <button 
                  onClick={() => {
                    setEditName(profile.name);
                    setEditDob(profile.dob);
                    setEditMobile(profile.mobile);
                    setEditEmail(profile.email);
                    setEditAddress(profile.address);
                    setIsEditOpen(true);
                  }} 
                  className="w-10 h-10 rounded-full bg-[#FDE7F3] flex items-center justify-center hover:bg-pink-100 transition-colors text-[#b90064] cursor-pointer"
                >
                  <Edit size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold flex items-center gap-1">
                    Legal Name 
                    <Lock size={10} className="text-gray-400" title="Locked by KYC" />
                  </p>
                  <p className="text-sm font-extrabold text-[#1b1c1b]">{profile.name}</p>
                </div>
                <div className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold flex items-center gap-1">
                    Date of Birth 
                    <Lock size={10} className="text-gray-400" title="Locked by KYC" />
                  </p>
                  <p className="text-sm font-extrabold text-[#1b1c1b]">{formatDateString(profile.dob)}</p>
                </div>
                <div className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold">Mobile Number</p>
                    <button 
                      onClick={() => setIsEditOpen(true)} 
                      className="text-[#b90064] text-[11px] font-black hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm font-extrabold text-[#1b1c1b] flex items-center gap-1.5">
                    {profile.mobile}
                    <CheckCircle size={14} className="text-emerald-600" />
                  </p>
                </div>
                <div className="space-y-1 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold">Email Address</p>
                    <button 
                      onClick={() => setIsEditOpen(true)} 
                      className="text-[#b90064] text-[11px] font-black hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-sm font-extrabold text-[#1b1c1b] flex items-center gap-1.5">
                    {profile.email}
                    <CheckCircle size={14} className="text-emerald-600" />
                  </p>
                </div>
                <div className="md:col-span-2 space-y-1 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold">Communication Address</p>
                  <p className="text-sm font-extrabold text-[#1b1c1b] leading-relaxed">{profile.address}</p>
                </div>
              </div>
            </section>

            {/* KYC & Documents */}
            <section className="bg-white rounded-[18px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2E7D32]"></div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-bold text-[#1b1c1b]">KYC &amp; Documents</h3>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#2E7D32] text-[10px] font-extrabold flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-600" /> Verified
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setKycDoc('pan');
                    setIsKycOpen(true);
                  }} 
                  className="text-[#b90064] text-[13px] font-bold hover:underline cursor-pointer"
                >
                  View Details
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div 
                  onClick={() => {
                    setKycDoc('pan');
                    setIsKycOpen(true);
                  }} 
                  className="flex-1 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 cursor-pointer border border-gray-100 flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-50 text-[#b90064] flex items-center justify-center shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold mb-0.5">PAN Card</p>
                    <p className="text-sm font-extrabold text-[#1b1c1b] tracking-wider font-mono">ABCDE****F</p>
                  </div>
                </div>
                <div 
                  onClick={() => {
                    setKycDoc('aadhaar');
                    setIsKycOpen(true);
                  }} 
                  className="flex-1 p-4 rounded-xl bg-gray-50 hover:bg-gray-100/70 cursor-pointer border border-gray-100 flex items-center gap-4 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-pink-50 text-[#b90064] flex items-center justify-center shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5a3f47] uppercase tracking-wider font-bold mb-0.5">Aadhaar Card</p>
                    <p className="text-sm font-extrabold text-[#1b1c1b] tracking-wider font-mono">XXXX XXXX 4582</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* --- ALL MODALS (AnimatePresence) --- */}

      {/* 1. EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsEditOpen(false)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl z-10 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-gray-900 tracking-tight">Edit Partner Profile</h3>
                <button 
                  onClick={() => setIsEditOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064]"
                  />
                  <p className="text-[9px] text-gray-400 font-medium">Must match your verified PAN / Aadhaar card details.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Communication Address</label>
                  <textarea
                    required
                    rows={3}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064] focus:ring-1 focus:ring-[#b90064]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-12 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#b90064] hover:bg-pink-800 text-white h-12 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DIGITAL PARTNER ID CARD MODAL */}
      <AnimatePresence>
        {isIdOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#fcf9f8]/75 backdrop-blur-md"
              onClick={() => setIsIdOpen(false)}
            ></motion.div>

            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-[340px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-white w-full rounded-[18px] flex flex-col overflow-hidden border border-gray-200 shadow-[0px_12px_48px_rgba(0,0,0,0.12)]"
              >
                {/* Card Header */}
                <div className="bg-[#FDE7F3] p-6 flex flex-col items-center justify-center text-center border-b border-gray-100/30">
                  <span className="text-2xl text-[#b90064] font-bold tracking-tight mb-1">Nexora</span>
                  <span className="text-[11px] text-[#5a3f47] font-semibold uppercase tracking-wider">Growth Partner ID</span>
                </div>

                {/* Card Body - Profile */}
                <div className="p-6 flex flex-col items-center relative">
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md -mt-16 overflow-hidden relative z-10 mb-4 bg-gray-100">
                    <img 
                      alt={profile.name + " Photo"} 
                      className="w-full h-full object-cover" 
                      src={profile.profileImage} 
                    />
                  </div>

                  {/* Name & Status */}
                  <h2 className="text-xl font-bold text-[#1b1c1b] mb-2 text-center">{profile.name}</h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
                    <CheckCircle size={16} className="text-emerald-600 fill-emerald-600/10" />
                    <span className="text-xs text-emerald-600 font-bold">Verified</span>
                  </div>

                  {/* Details Grid */}
                  <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 text-left mb-6 border-t border-gray-100 pt-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#5a3f47] font-semibold mb-1">Partner ID</span>
                      <span className="text-sm text-[#1b1c1b] font-bold">GP-JPR-1024</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#5a3f47] font-semibold mb-1">Role</span>
                      <span className="text-sm text-[#1b1c1b] font-bold">Growth Partner</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#5a3f47] font-semibold mb-1">Territory</span>
                      <span className="text-sm text-[#1b1c1b] font-bold">Jaipur District</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#5a3f47] font-semibold mb-1">Member Since</span>
                      <span className="text-sm text-[#1b1c1b] font-bold">15 Jan 2026</span>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="w-full flex flex-col items-center border-t border-gray-100 pt-5">
                    <div className="w-24 h-24 bg-gray-50 rounded-lg p-2 border border-gray-200 flex items-center justify-center relative overflow-hidden">
                      <QrCode size={48} className="text-[#b90064] opacity-40" />
                      <div className="absolute inset-0 border-2 border-[#b90064]/10 rounded-lg"></div>
                    </div>
                    <span className="text-[11px] text-[#5a3f47] font-semibold mt-3 text-center">Scan to verify authenticity</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-gray-50 flex flex-col gap-3 rounded-b-[18px]">
                  <button 
                    onClick={() => triggerToast('Digital ID card downloaded successfully.')}
                    className="w-full h-[56px] rounded-[16px] bg-[#b90064] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#b90064]/90 transition-colors active:scale-[0.98] cursor-pointer"
                  >
                    <Download size={20} />
                    Download ID Card
                  </button>
                  <button 
                    onClick={() => triggerToast('Sharing ID card...')}
                    className="w-full h-[56px] rounded-[16px] bg-[#FDE7F3] text-[#b90064] text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#FDE7F3]/80 transition-colors active:scale-[0.98] cursor-pointer"
                  >
                    <Share2 size={20} />
                    Share ID Card
                  </button>
                </div>
              </motion.div>

              {/* Global Close Button */}
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                aria-label="Close Digital ID" 
                onClick={() => setIsIdOpen(false)}
                className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-center text-[#1b1c1b] hover:bg-gray-50 transition-colors active:scale-95 cursor-pointer"
              >
                <X size={28} />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. COMPLETE PROFILE (ADD ALTERNATE PHONE) MODAL */}
      <AnimatePresence>
        {isCompleteOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsCompleteOpen(false)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 p-6 space-y-4"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-pink-50 text-[#b90064] rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Add Alternate Mobile Number</h3>
                <p className="text-xs text-gray-500 leading-normal font-semibold">
                  Complete your profile to <span className="text-emerald-600 font-bold">100% progress status</span> by linking an alternate secure contact.
                </p>
              </div>

              <form onSubmit={handleSaveAltPhone} className="space-y-3.5">
                <div className="space-y-1">
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={altPhone}
                    onChange={(e) => {
                      setAltPhone(e.target.value);
                      if (altPhoneError) setAltPhoneError('');
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-hidden focus:border-[#b90064]"
                  />
                  {altPhoneError && (
                    <p className="text-[10px] text-red-500 font-bold">{altPhoneError}</p>
                  )}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCompleteOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-11 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#b90064] hover:bg-pink-700 text-white h-11 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Link Number
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PAUSE ACCOUNT MODAL */}
      <AnimatePresence>
        {isPauseOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsPauseOpen(false)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Pause size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Pause Account Operations?</h3>
                <p className="text-xs text-gray-500 leading-normal font-semibold">
                  This will temporarily disable new merchant onboarding campaigns and pause active scan payouts. You can unpause anytime.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsPauseOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-12 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  No, Keep Active
                </button>
                <button
                  onClick={() => {
                    setIsPauseOpen(false);
                    triggerToast('Partner account operations paused.');
                  }}
                  className="flex-1 bg-[#ED6C02] hover:bg-orange-700 text-white h-12 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Yes, Pause Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CLOSE ACCOUNT MODAL */}
      <AnimatePresence>
        {isCloseOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsCloseOpen(false)}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-xs animate-pulse">
                <Trash2 size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-red-600 tracking-tight">Terminate Partner Account?</h3>
                <p className="text-xs text-gray-500 leading-normal font-semibold">
                  Warning! This action is <span className="font-bold text-red-500">irreversible</span>. You will permanently lose access to GP-JPR-1024, all referring shop commissions, and cumulative milestone claims.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setIsCloseOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-12 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsCloseOpen(false);
                    triggerToast('Account termination request registered.');
                  }}
                  className="flex-1 bg-[#BA1A1A] hover:bg-red-800 text-white h-12 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Request Termination
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. KYC DOCUMENT VIEWER MODAL */}
      <AnimatePresence>
        {isKycOpen && kycDoc && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
              onClick={() => {
                setIsKycOpen(false);
                setKycDoc(null);
              }}
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={16} className="text-[#b90064]" /> 
                  <span>{kycDoc === 'pan' ? 'PAN Card Document' : 'Aadhaar Card Document'}</span>
                </h3>
                <button 
                  onClick={() => {
                    setIsKycOpen(false);
                    setKycDoc(null);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* KYC Document Card Illustration */}
              <div className="bg-gradient-to-br from-gray-50 to-pink-50 p-6 rounded-2xl border border-gray-100 relative shadow-inner flex flex-col justify-between h-48">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block">GOVERNMENT OF INDIA</span>
                    <span className="text-[8px] text-pink-700/80 font-semibold uppercase tracking-wider">KYC Verification Node</span>
                  </div>
                  <CheckCircle size={20} className="text-emerald-600 fill-emerald-50" />
                </div>

                <div className="space-y-1 pt-4">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">
                    {kycDoc === 'pan' ? 'Permanent Account Number' : 'Aadhaar Unique ID'}
                  </span>
                  <span className="text-base font-extrabold text-gray-800 tracking-widest font-mono">
                    {kycDoc === 'pan' ? 'ABCDE1482F' : '3841 8592 4582'}
                  </span>
                </div>

                <div className="flex justify-between items-end border-t border-gray-200/50 pt-2 text-[9px] text-gray-500 font-bold uppercase">
                  <div>
                    <span className="text-[8px] text-gray-400 block">Name</span>
                    <span className="text-gray-800 font-extrabold">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 block">Status</span>
                    <span className="text-emerald-700 font-extrabold">Validated</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/50 text-[10.5px] text-emerald-800 leading-normal font-semibold flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  This document has been securely validated with NSDL &amp; UIDAI systems during partner registration and KYC verification.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsKycOpen(false);
                    setKycDoc(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Close Document
                </button>
                <button
                  onClick={() => triggerToast('Document verification receipt downloaded.')}
                  className="flex-1 bg-[#b90064] hover:bg-pink-700 text-white py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download receipt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      <BottomNav onNavigate={onNavigate} currentPage="profile" />

    </div>
  );
}

