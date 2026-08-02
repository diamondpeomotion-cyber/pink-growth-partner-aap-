import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSwipe } from './hooks/useSwipe';
import { ArrowLeft } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ScanQRScreen from './components/dashboard/ScanQRScreen';
import TicketDetailsScreen from './components/dashboard/TicketDetailsScreen';
import NewTicketScreen from './components/dashboard/NewTicketScreen';
import HelpArticleScreen from './components/dashboard/HelpArticleScreen';
import OfflineNotificationBanner from './components/OfflineNotificationBanner';

// Heavy route-level screens are code-split so the initial bundle only carries
// the login + dashboard path instead of every screen in the app.
const AddShop = lazy(() => import('./components/AddShop'));
const MyShopsScreen = lazy(() => import('./components/dashboard/MyShopsScreen'));
const ProfileScreen = lazy(() => import('./components/dashboard/ProfileScreen'));
const WebsiteSettingsScreen = lazy(() => import('./components/dashboard/WebsiteSettingsScreen'));
const RewardsScreen = lazy(() => import('./components/dashboard/RewardsScreen'));
const ShopEarningsLedgerScreen = lazy(() => import('./components/dashboard/ShopEarningsLedgerScreen'));
const RewardDetailsScreen = lazy(() => import('./components/dashboard/RewardDetailsScreen'));
const ShopQualificationDetails = lazy(() => import('./components/dashboard/ShopQualificationDetails'));
const NotificationsScreen = lazy(() => import('./components/dashboard/NotificationsScreen'));
const PayoutsScreen = lazy(() => import('./components/dashboard/PayoutsScreen'));
const QREarningsScreen = lazy(() => import('./components/dashboard/QREarningsScreen'));
const PayoutHistoryScreen = lazy(() => import('./components/dashboard/PayoutHistoryScreen'));
const AccountSettingsScreen = lazy(() => import('./components/dashboard/AccountSettingsScreen'));
const WebsitePreviewScreen = lazy(() => import('./components/dashboard/WebsitePreviewScreen'));
const SupportScreen = lazy(() => import('./components/dashboard/SupportScreen'));

/**
 * Screens that already render their own back arrow inside their header.
 * For these the global floating back button must stay hidden, otherwise the
 * user sees two overlapping back arrows in the top-left corner.
 */
const SCREENS_WITH_OWN_BACK_BUTTON = new Set([
  'add-shop',
  'website-settings',
  'website-preview',
  'account-settings',
  'scan-qr',
  'support',
  'help-article',
  'ticket-details',
  'new-ticket',
  'notifications',
  'rewards',
  'reward-details',
  'profile',
  'shops',
  'shop-qualification',
  'earnings',
  'shop-earnings-ledger',
  'payout-history',
  'payouts',
]);

export const DEFAULT_PARTNER_PROFILE = {
  name: 'Rahul Verma',
  mobile: '9876543210',
  email: 'rahul.verma@nexoragrowth.in',
  agentCode: 'NX-RJ-8842',
  city: 'Jaipur, Rajasthan',
  upiId: 'rahulverma@okaxis',
  joinedDate: '15 Jan 2024',
  status: 'Active Partner'
};

export const DEFAULT_DASHBOARD_CACHE = {
  availableAmount: 8400,
  qualifyingShopsCount: 250,
  totalShopsCount: 250,
  monthlyEarnings: 42500,
  pendingPayouts: 1800,
  lastSyncTime: new Date().toISOString(),
  offlinePendingActionsCount: 0,
};

/** Lightweight placeholder shown while a code-split screen is downloading. */
function ScreenLoader() {
  return (
    <div className="flex-1 min-h-[60vh] w-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-primary animate-spin" />
      <p className="text-xs font-semibold text-gray-400">Loading…</p>
    </div>
  );
}

export default function App() {
  const swipeRef = useRef<HTMLDivElement>(null);

  // Read the auth flag during initialisation. Doing this in an effect made the
  // login screen flash for one frame on every reload for already-signed-in users.
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [history, setHistory] = useState<string[]>(['dashboard']);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Initialize persistent storage layer in localStorage
  useEffect(() => {
    try {
      if (!localStorage.getItem('nexora_partner_profile')) {
        localStorage.setItem('nexora_partner_profile', JSON.stringify(DEFAULT_PARTNER_PROFILE));
      }
      if (!localStorage.getItem('nexora_dashboard_cache')) {
        localStorage.setItem('nexora_dashboard_cache', JSON.stringify(DEFAULT_DASHBOARD_CACHE));
      }
    } catch (err) {
      console.warn('Unable to access localStorage for persistent user cache:', err);
    }
  }, []);

  useEffect(() => {
    let syncTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      
      // Update persistent storage cache on online sync
      try {
        const cache = localStorage.getItem('nexora_dashboard_cache');
        const parsedCache = cache ? JSON.parse(cache) : DEFAULT_DASHBOARD_CACHE;
        const updatedCache = {
          ...parsedCache,
          lastSyncTime: new Date().toISOString(),
        };
        localStorage.setItem('nexora_dashboard_cache', JSON.stringify(updatedCache));
        localStorage.setItem('nexora_last_sync_timestamp', new Date().toISOString());
      } catch (e) {
        console.error('Failed updating cache on network status change:', e);
      }

      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => setIsSyncing(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // BroadcastChannel is unavailable in some browsers (e.g. Safari < 15.4).
    // Constructing it unguarded threw and aborted the whole effect, so the
    // online/offline listeners were never cleaned up.
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('nexora_sync_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          setIsSyncing(false);
          try {
            const cache = localStorage.getItem('nexora_dashboard_cache');
            const parsedCache = cache ? JSON.parse(cache) : DEFAULT_DASHBOARD_CACHE;
            const updatedCache = {
              ...parsedCache,
              lastSyncTime: new Date().toISOString(),
            };
            localStorage.setItem('nexora_dashboard_cache', JSON.stringify(updatedCache));
          } catch (e) {
            console.error('Failed syncing cache on broadcast:', e);
          }
        }
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(syncTimer);
      channel?.close();
    };
  }, []);

  const navigateTo = (page: string) => {
    setHistory(prev => [...prev, page]);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setCurrentPage(newHistory[newHistory.length - 1]);
    } else {
      setCurrentPage('dashboard');
    }
  };
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useSwipe(swipeRef, {
    onSwipedRight: () => {
      if (currentPage !== 'dashboard') {
        goBack();
      }
    },
    threshold: 80,
  });


  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoginForm onLoginSuccess={() => {
            localStorage.setItem('isAuthenticated', 'true');
            setIsLoggedIn(true);
          }} />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentPage === 'add-shop') {
      return <AddShop 
        onBack={goBack} 
        onComplete={() => navigateTo('website-settings')} 
      />;
    }

    if (currentPage === 'website-settings') {
      return <WebsiteSettingsScreen onBack={goBack} onNavigate={navigateTo} />;
    }

    if (currentPage === 'website-preview') {
      return <WebsitePreviewScreen onBack={goBack} />;
    }

    if (currentPage === 'account-settings') {
      return <AccountSettingsScreen onBack={goBack} />;
    }

    if (currentPage === 'scan-qr') {
      return <ScanQRScreen onBack={goBack} />;
    }

    if (currentPage === 'support') {
      return <SupportScreen 
        onBack={goBack} 
        onNavigate={navigateTo}
        onViewTicket={(id) => {
          setSelectedTicketId(id);
          navigateTo('ticket-details');
        }}
        onViewArticle={(id) => {
          setSelectedArticleId(id);
          navigateTo('help-article');
        }}
      />;
    }

    if (currentPage === 'help-article') {
      return <HelpArticleScreen 
        articleId={selectedArticleId || 'verify-shop'} 
        onBack={goBack} 
      />;
    }

    if (currentPage === 'ticket-details') {
      return <TicketDetailsScreen 
        ticketId={selectedTicketId || 'TK-882'} 
        onBack={goBack} 
      />;
    }

    if (currentPage === 'new-ticket') {
      return <NewTicketScreen 
        onBack={goBack} 
      />;
    }

    if (currentPage === 'notifications') {
      return <NotificationsScreen 
        onBack={goBack} 
        onNavigate={navigateTo}
      />;
    }

    if (currentPage === 'rewards') {
      return <RewardsScreen 
        onNavigate={navigateTo}
        onBack={goBack} 
      />;
    }

    if (currentPage === 'reward-details') {
      return <RewardDetailsScreen 
        onNavigate={navigateTo}
        onBack={goBack} 
      />;
    }

    if (currentPage === 'profile') {
      return <ProfileScreen 
        onBack={goBack} 
        onNavigate={navigateTo} 
        onLogout={() => {
          localStorage.removeItem('isAuthenticated');
          setIsLoggedIn(false);
        }} 
      />;
    }

    if (currentPage === 'shops') {
      return <MyShopsScreen 
        onNavigate={navigateTo} 
        onBack={goBack} 
      />;
    }

    if (currentPage === 'shop-qualification') {
      return <ShopQualificationDetails 
        onNavigate={navigateTo} 
        onBack={() => navigateTo('shops')} 
      />;
    }

    if (currentPage === 'earnings') {
      return <QREarningsScreen 
        onNavigate={navigateTo} 
        onBack={goBack} 
      />;
    }

    if (currentPage === 'shop-earnings-ledger') {
      return <ShopEarningsLedgerScreen 
        onNavigate={navigateTo}
        onBack={() => navigateTo('earnings')}
      />;
    }

    if (currentPage === 'payout-history') {
      return <PayoutHistoryScreen 
        onNavigate={navigateTo}
        onBack={() => navigateTo('payouts')}
      />;
    }

    if (currentPage === 'payouts') {
      return <PayoutsScreen 
        onNavigate={navigateTo}
        onBack={() => navigateTo('earnings')}
      />;
    }

    return <Dashboard 
      isOnline={isOnline}
      isSyncing={isSyncing}
      onNavigate={navigateTo}
      onLogout={() => {
        localStorage.removeItem('isAuthenticated');
        setIsLoggedIn(false);
      }} />;
  };

  return (
    <div ref={swipeRef} className="h-screen max-h-screen w-full flex flex-col bg-[#fcf9f8] overflow-hidden">
      <OfflineNotificationBanner isOnline={isOnline} />
      {/* Floating back button is only rendered for screens that do NOT provide
          their own in-header back control, otherwise two stacked arrows appear. */}
      {currentPage !== 'dashboard' && !SCREENS_WITH_OWN_BACK_BUTTON.has(currentPage) && (
        <div className="fixed top-0 left-0 z-[100] p-4 pointer-events-none">
          <button 
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-primary pointer-events-auto active:scale-95 transition-all border border-pink-100 hover:bg-white"
            title="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="min-h-full w-full shadow-lg bg-[#fcf9f8] relative flex flex-col overflow-x-hidden">
          <Suspense fallback={<ScreenLoader />}>
            {renderContent()}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
