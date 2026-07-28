import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Smartphone, 
  Bell, 
  CheckCircle2, 
  Save, 
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AccountSettingsScreen({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('nexora_partner_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      name: 'Rajesh Kumar',
      email: 'r.kumar@example.com',
      mobile: '+91 98321 45678',
      alternateMobile: '',
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('Nexora@2026');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [notifPreferences, setNotifPreferences] = useState({
    email: true,
    whatsapp: true,
    sms: false,
    payouts: true,
    bookings: true
  });

  const handleSaveProfile = () => {
    localStorage.setItem('nexora_partner_profile', JSON.stringify(profile));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpdatePassword = () => {
    if (!newPassword) return;
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New Password and Confirm New Password do not match!', type: 'error' });
      return;
    }
    setCurrentPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const toggleNotif = (key: keyof typeof notifPreferences) => {
    setNotifPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1b] pb-28 w-full shadow-lg border-x border-gray-100">
      {/* Header */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between px-[--page-margin] h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-primary">Account Settings</h1>
              <p className="text-[10px] text-gray-500">Manage your profile & security</p>
            </div>
          </div>
          <button 
            onClick={handleSaveProfile}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-[--page-margin] pt-6 space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Account details updated successfully!</p>
              <p className="text-xs text-emerald-700">Your profile information has been synchronized across the platform.</p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
            <div className="p-2 bg-pink-50 rounded-lg">
              <User size={20} className="text-primary" />
            </div>
            <h3 className="font-bold text-gray-900">Personal Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Full Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Email Address</label>
              <input 
                type="email" 
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Primary Mobile</label>
              <input 
                type="tel" 
                value={profile.mobile}
                onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 ml-1">Alternate Mobile (Optional)</label>
              <input 
                type="tel" 
                placeholder="+91 00000 00000"
                value={profile.alternateMobile || ''}
                onChange={(e) => setProfile({ ...profile, alternateMobile: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Password & Security */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Lock size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Security & Password</h3>
              <p className="text-xs text-gray-500">Manage and update your login password</p>
            </div>
          </div>

          {passwordMsg && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              passwordMsg.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <Lock size={16} className="text-rose-600 shrink-0" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-xs font-semibold text-gray-600 ml-1 block mb-1.5">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors cursor-pointer"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Password */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1 block mb-1.5">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-xs font-semibold text-gray-600 ml-1 block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 font-medium focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleUpdatePassword}
              disabled={!newPassword || !confirmPassword}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                newPassword && confirmPassword 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.99]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-gray-50">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Bell size={20} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900">Notification Preferences</h3>
          </div>

          <div className="space-y-1">
            {[
              { id: 'whatsapp', name: 'WhatsApp Notifications', desc: 'Real-time updates about leads and bookings', icon: Smartphone },
              { id: 'email', name: 'Email Updates', desc: 'Daily summaries, invoices, and performance reports', icon: CheckCircle2 },
              { id: 'payouts', name: 'Payout Alerts', desc: 'Instant notification when a payout is processed', icon: ShieldCheck },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                    <pref.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{pref.name}</h4>
                    <p className="text-[11px] text-gray-500">{pref.desc}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleNotif(pref.id as any)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${notifPreferences[pref.id as keyof typeof notifPreferences] ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-sm"></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Controls */}
        <div className="bg-red-50 rounded-3xl p-6 border border-red-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-red-900 text-base">Deactivate Account</h3>
            <p className="text-[11px] text-red-700 mt-0.5">Temporarily hide your profile and storefront from Nexora.</p>
          </div>
          <button className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
            Deactivate
          </button>
        </div>
      </main>
    </div>
  );
}
