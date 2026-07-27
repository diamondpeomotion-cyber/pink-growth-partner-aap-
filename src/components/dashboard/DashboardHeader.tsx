import React from 'react';
import { Bell, LogOut } from 'lucide-react';

export default function DashboardHeader({ onLogout, onNavigate }: { onLogout: () => void, onNavigate?: (page: string) => void }) {
  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('nexora_partner_profile');
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.profileImage) {
          setProfileImage(profile.profileImage);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-white/75 backdrop-blur-md shadow-sm flex justify-between items-center px-5 h-16">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[#b90064] cursor-pointer" onClick={() => onNavigate?.('dashboard')}>Nexora Growth</h1>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate?.('notifications')} 
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#5a3f47] hover:bg-[#fde7f3] transition-colors cursor-pointer relative"
          title="Notifications"
        >
          <Bell size={24} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b90064] rounded-full border border-white"></span>
        </button>
        <div 
          onClick={() => onNavigate?.('profile')}
          className="w-10 h-10 rounded-full bg-[#b90064] text-white flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-[#f0edec] cursor-pointer hover:opacity-95"
          title="View Profile"
        >
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            "RV"
          )}
        </div>
        <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center text-[#5a3f47] hover:bg-[#fde7f3] transition-colors cursor-pointer" title="Log Out">
          <LogOut size={24} />
        </button>
      </div>
    </header>
  );
}
