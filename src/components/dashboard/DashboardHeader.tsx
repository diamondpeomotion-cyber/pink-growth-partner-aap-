import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, WifiOff, RefreshCw, CheckCircle2, Smartphone, Clock, Database, X, ShieldCheck } from 'lucide-react';
import InstallAppModal from '../InstallAppModal';
import Avatar from '../Avatar';

function formatSyncTime(date: Date): string {
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function OfflineSyncStatus({ 
  isOnline, 
  isSyncing, 
  lastSyncedAt, 
  onClick 
}: { 
  isOnline: boolean; 
  isSyncing: boolean; 
  lastSyncedAt: Date | null; 
  onClick: () => void;
}) {
  // `tick` only exists to re-render the relative timestamp every 10s. The label
  // itself is derived during render so it is always in sync with `lastSyncedAt`
  // (previously the effect wrote stale state on the first pass after a change).
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastSyncedAt) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  const formattedTime = lastSyncedAt ? formatSyncTime(lastSyncedAt) : 'Just now';

  if (!isOnline) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full border border-red-100 transition-all cursor-pointer"
        title="Click for sync status details"
      >
        <WifiOff size={10} className="text-red-600 shrink-0" />
        <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider">Offline</span>
      </button>
    );
  }

  if (isSyncing) {
    return (
      <button 
        onClick={onClick}
        className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-100 transition-all cursor-pointer"
        title="Syncing data..."
      >
        <RefreshCw size={10} className="text-amber-600 animate-spin shrink-0" />
        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Syncing...</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-100/90 transition-all cursor-pointer group/sync"
      title="Click to view detailed sync status"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>
      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Synced</span>
      <span className="text-[9px] font-semibold text-emerald-600/80 border-l border-emerald-200 pl-1.5 group-hover/sync:text-emerald-800">
        {formattedTime}
      </span>
    </button>
  );
}

export default function DashboardHeader({ 
  onLogout, 
  onNavigate, 
  isOnline = true, 
  isSyncing: externalSyncing = false,
  partnerName = 'Nexora Partner',
}: { 
  onLogout: () => void, 
  onNavigate?: (page: string) => void, 
  isOnline?: boolean, 
  isSyncing?: boolean,
  partnerName?: string,
}) {
  const profileImage: string | null = null;
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showSyncDetailsModal, setShowSyncDetailsModal] = useState(false);
  
  // Last sync timestamp state
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => {
    try {
      const saved = localStorage.getItem('nexora_last_sync_timestamp');
      if (saved) {
        const parsed = new Date(saved);
        // Guard against a corrupted value producing "Invalid Date" / NaN output.
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    } catch (err) {
      console.warn('Unable to read last sync timestamp:', err);
    }
    return new Date();
  });

  const [isInternalSyncing, setIsInternalSyncing] = useState(false);
  const isSyncing = externalSyncing || isInternalSyncing;

  // Stamp a new sync time only on the falling edge of `isSyncing`
  // (true -> false). The previous version also fired on mount, which reset the
  // persisted timestamp to "Just now" on every page load and threw away the
  // real last-sync time.
  const wasSyncingRef = useRef(isSyncing);
  useEffect(() => {
    if (wasSyncingRef.current && !isSyncing) {
      const now = new Date();
      setLastSyncedAt(now);
      try {
        localStorage.setItem('nexora_last_sync_timestamp', now.toISOString());
      } catch (err) {
        console.warn('Unable to persist last sync timestamp:', err);
      }
    }
    wasSyncingRef.current = isSyncing;
  }, [isSyncing]);

  const handleManualSync = () => {
    setIsInternalSyncing(true);
    setTimeout(() => {
      setIsInternalSyncing(false);
      const now = new Date();
      setLastSyncedAt(now);
      localStorage.setItem('nexora_last_sync_timestamp', now.toISOString());
    }, 1500);
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-xs border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto w-full flex justify-between items-center px-[var(--page-margin)] h-16">
        <div className="flex flex-col min-w-0 justify-center">
          <h1 
            style={{
              width: '144.5px',
              height: '29.4844px',
              marginRight: '1px',
              marginBottom: '-1px',
              paddingRight: '0px',
              paddingBottom: '0px',
              textAlign: 'right',
              lineHeight: '26.5px',
              fontSize: '19px',
              textDecorationLine: 'none',
              fontStyle: 'normal',
              fontWeight: 'bold',
            }}
            className="text-lg sm:text-xl font-bold text-[#b90064] cursor-pointer truncate leading-tight" 
            onClick={() => onNavigate?.('dashboard')}
          >
            Nexora Growth
          </h1>
          <div className="flex items-center h-5 mt-0.5">
            <OfflineSyncStatus 
              isOnline={isOnline} 
              isSyncing={isSyncing} 
              lastSyncedAt={lastSyncedAt}
              onClick={() => setShowSyncDetailsModal(true)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={() => setIsInstallModalOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#b90064] bg-[#fde7f3] hover:bg-pink-200 transition-colors cursor-pointer relative"
            title="Install Nexora App"
          >
            <Smartphone size={18} />
          </button>
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
            <Avatar
              src={profileImage}
              name={partnerName}
              className="w-full h-full"
              textClassName="text-sm text-white"
              alt="Profile"
            />
          </div>
          <button onClick={onLogout} className="w-9 h-9 rounded-full flex items-center justify-center text-[#5a3f47] hover:bg-[#fde7f3] transition-colors cursor-pointer" title="Log Out">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <InstallAppModal 
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Sync Status Details Modal */}
      {showSyncDetailsModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowSyncDetailsModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-primary" />
                <h3 className="font-extrabold text-sm text-gray-900">Data Freshness & Sync</h3>
              </div>
              <button
                onClick={() => setShowSyncDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="my-4 space-y-3">
              {/* Main Status Box */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900">Nexora Cloud Connection Active</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">All shop logs & earnings are up to date.</p>
                </div>
              </div>

              {/* Exact Sync Timestamp */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    Last Successful Sync:
                  </span>
                  <span className="font-black text-gray-900">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    Sync Status:
                  </span>
                  <span className="font-bold text-emerald-600">
                    {isOnline ? 'Online • 0 pending changes' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowSyncDetailsModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 h-10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleManualSync();
                  setTimeout(() => setShowSyncDetailsModal(false), 800);
                }}
                disabled={isSyncing}
                className="flex-1 bg-primary hover:bg-[#a00056] text-white h-10 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

