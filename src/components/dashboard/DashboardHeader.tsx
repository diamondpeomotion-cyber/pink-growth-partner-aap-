import React from 'react';
import { Bell, LogOut, WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

function OfflineSyncStatus({ isOnline, isSyncing }: { isOnline: boolean; isSyncing: boolean }) {
  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
        <WifiOff size={10} className="text-red-600" />
        <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Offline Mode</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
        <RefreshCw size={10} className="text-amber-600 animate-spin" />
        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Syncing Data</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
      <CheckCircle2 size={10} className="text-emerald-600" />
      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Synced</span>
    </div>
  );
}

export default function DashboardHeader({ onLogout, onNavigate, isOnline = true, isSyncing = false }: { onLogout: () => void, onNavigate?: (page: string) => void, isOnline?: boolean, isSyncing?: boolean }) {
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
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full z-50 bg-white/90 backdrop-blur-md shadow-xs flex justify-between items-center px-3 h-16 max-w-md mx-auto border-b border-gray-100">
      <div className="flex flex-col min-w-0 justify-center">
        <h1 className="text-lg sm:text-xl font-bold text-[#b90064] cursor-pointer truncate leading-tight" onClick={() => onNavigate?.('dashboard')}>Nexora Growth</h1>
        <div className="flex items-center h-5 mt-0.5">
          <OfflineSyncStatus isOnline={isOnline} isSyncing={isSyncing} />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button 
          onClick={() => onNavigate?.('notifications')} 
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#5a3f47] hover:bg-[#fde7f3] transition-colors cursor-pointer relative"
          title="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#b90064] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
            2
          </span>
        </button>
        <div 
          onClick={() => onNavigate?.('profile')}
          className="w-9 h-9 rounded-full bg-[#b90064] text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-[#f0edec] cursor-pointer hover:opacity-95"
          title="View Profile"
        >
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            "RV"
          )}
        </div>
        <button onClick={onLogout} className="w-9 h-9 rounded-full flex items-center justify-center text-[#5a3f47] hover:bg-[#fde7f3] transition-colors cursor-pointer" title="Log Out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
