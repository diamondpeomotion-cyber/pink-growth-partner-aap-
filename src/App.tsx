import { useState, useEffect, useRef } from 'react';
import { useSwipe } from './hooks/useSwipe';
import { ArrowLeft } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AddShop from './components/AddShop';
import ScanQRScreen from './components/dashboard/ScanQRScreen';
import SupportScreen from './components/dashboard/SupportScreen';
import RewardsScreen from './components/dashboard/RewardsScreen';
import WebsiteSettingsScreen from './components/dashboard/WebsiteSettingsScreen';
import WebsitePreviewScreen from './components/dashboard/WebsitePreviewScreen';
import ProfileScreen from './components/dashboard/ProfileScreen';
import AccountSettingsScreen from './components/dashboard/AccountSettingsScreen';
import MyShopsScreen from './components/dashboard/MyShopsScreen';
import ShopQualificationDetails from './components/dashboard/ShopQualificationDetails';
import QREarningsScreen from './components/dashboard/QREarningsScreen';
import ShopEarningsLedgerScreen from './components/dashboard/ShopEarningsLedgerScreen';
import PayoutHistoryScreen from './components/dashboard/PayoutHistoryScreen';
import PayoutsScreen from './components/dashboard/PayoutsScreen';
import RewardDetailsScreen from './components/dashboard/RewardDetailsScreen';
import TicketDetailsScreen from './components/dashboard/TicketDetailsScreen';
import NewTicketScreen from './components/dashboard/NewTicketScreen';
import HelpArticleScreen from './components/dashboard/HelpArticleScreen';
import NotificationsScreen from './components/dashboard/NotificationsScreen';

export default function App() {
  const swipeRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [history, setHistory] = useState<string[]>(['dashboard']);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const channel = new BroadcastChannel('nexora_sync_channel');
    channel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        setIsSyncing(false);
      }
    };

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      channel.close();
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


  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => {
      localStorage.setItem('isAuthenticated', 'true');
      setIsLoggedIn(true);
    }} />;
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
      {currentPage !== 'dashboard' && (
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full pt-16 md:pt-0">
        <div className="min-h-full w-full max-w-md mx-auto shadow-lg border-x border-gray-100 bg-[#fcf9f8] relative flex flex-col overflow-x-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
