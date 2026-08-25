import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useSwipe } from './hooks/useSwipe';
import { ArrowLeft } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ScanQRScreen from './components/dashboard/ScanQRScreen';
import TicketDetailsScreen from './components/dashboard/TicketDetailsScreen';
import NewTicketScreen from './components/dashboard/NewTicketScreen';
import HelpArticleScreen from './components/dashboard/HelpArticleScreen';
import OfflineNotificationBanner from './components/OfflineNotificationBanner';
import {
  supabase,
  supabaseConfigError,
  initialRecoveryLink,
  initialRecoveryTokens,
  clearAllAuthStorage,
} from './lib/supabaseClient';
import { checkGrowthPartnerAccess } from './lib/gpRepository';
import { clearProtectedState } from './lib/protectedState';
import { redirectToLogin, restoreFromLogin } from './lib/authRedirect';
import { useLocationSync } from './hooks/useLocationSync';
import ResetPasswordScreen from './components/ResetPasswordScreen';

// Heavy route-level screens are code-split so the initial bundle only carries
// the login + dashboard path instead of every screen in the app.
const AddShop = lazy(() => import('./components/AddShop'));
const MyShopsScreen = lazy(() => import('./components/dashboard/MyShopsScreen'));
const ProfileScreen = lazy(() => import('./components/dashboard/ProfileScreen'));
// White Label -> Website now points at the ported Website Onboarding flow
// (replaces the retired WebsiteSettingsScreen / WebsitePreviewScreen mock).
const WebsiteOnboardingScreen = lazy(() => import('./components/dashboard/WebsiteOnboardingScreen'));
const RewardsScreen = lazy(() => import('./components/dashboard/RewardsScreen'));
const ShopEarningsLedgerScreen = lazy(() => import('./components/dashboard/ShopEarningsLedgerScreen'));
const RewardDetailsScreen = lazy(() => import('./components/dashboard/RewardDetailsScreen'));
const ShopQualificationDetails = lazy(() => import('./components/dashboard/ShopQualificationDetails'));
const NotificationsScreen = lazy(() => import('./components/dashboard/NotificationsScreen'));
const PayoutsScreen = lazy(() => import('./components/dashboard/PayoutsScreen'));
const QREarningsScreen = lazy(() => import('./components/dashboard/QREarningsScreen'));
const PayoutHistoryScreen = lazy(() => import('./components/dashboard/PayoutHistoryScreen'));
const AccountSettingsScreen = lazy(() => import('./components/dashboard/AccountSettingsScreen'));
const SupportScreen = lazy(() => import('./components/dashboard/SupportScreen'));

/**
 * Screens that already render their own back arrow inside their header.
 * For these the global floating back button must stay hidden, otherwise the
 * user sees two overlapping back arrows in the top-left corner.
 */
const SCREENS_WITH_OWN_BACK_BUTTON = new Set([
  'add-shop',
  'website-onboarding',
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

/**
 * Screens that own the whole viewport and scroll internally. They must not be
 * nested inside the app's page scroller or they get a second scrollbar.
 */
const FULL_HEIGHT_SCREENS = new Set(['website-onboarding']);

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

/** Shown when a password-reset link is dead (expired / used / revoked). */
const RECOVERY_LINK_EXPIRED_MESSAGE =
  'This reset link is invalid, expired or was already used. Request a fresh one below.';

type RecoveryState = 'none' | 'pending' | 'active' | 'invalid';

/** Pure derivation of the recovery state from the URL captured at module
 *  load (lib/supabase.ts). Shared by the lazy state + ref initializers so
 *  they can never disagree. */
const computeInitialRecoveryState = (): RecoveryState => {
  if (!initialRecoveryLink.intent) return 'none';
  if (initialRecoveryLink.error) return 'invalid';
  if (!initialRecoveryTokens) return 'invalid';
  return 'pending';
};

const computeInitialRecoveryError = (): string | null => {
  if (!initialRecoveryLink.intent) return null;
  if (initialRecoveryLink.error) return initialRecoveryLink.error;
  if (!initialRecoveryTokens) return RECOVERY_LINK_EXPIRED_MESSAGE;
  return null;
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

  // Real Supabase session drives the auth state (replaces the fake
  // localStorage 'isAuthenticated' flag). Authentication alone is NOT access:
  // every session (fresh or restored) is authorized against the permanent
  // role stored in the database — never localStorage, URL or app state.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // No client means there is no session to restore — the auth gate is ready
  // immediately (the config-error surface renders instead).
  const [authReady, setAuthReady] = useState(() => supabase === null);
  const authVerifySeq = useRef(0);
  // Last user we authorized — its per-user caches are wiped by
  // clearProtectedState(userId) when the session disappears (see
  // lib/protectedState.ts: dashboard cache, partner profile, shop draft,
  // selected-shop + GPS fix caches — the full nexora_* inventory).
  const authorizedUserIdRef = useRef<string | null>(null);

  // Wipe the signed-out user's protected caches and drop the id reference.
  const clearProtectedStateForCurrentUser = () => {
    clearProtectedState(authorizedUserIdRef.current);
    authorizedUserIdRef.current = null;
  };

  // ---- Password recovery (Phase 3) ----
  // 'pending'  = a recovery link was opened, waiting for Supabase to verify it
  // 'active'   = Supabase accepted the recovery token (PASSWORD_RECOVERY)
  // 'invalid'  = link expired/used/revoked (or carried an error) — no reset
  // Initial recovery state is DERIVED from the synchronously-captured URL
  // (lib/supabase.ts) — lazy initializers only, so no setState-in-effect.
  // The ref mirrors the same derivation so the role gate can never run
  // against a recovery session (a Customer must be able to reset too).
  const [recovery, setRecovery] = useState<RecoveryState>(computeInitialRecoveryState);
  const [recoveryError, setRecoveryError] = useState<string | null>(computeInitialRecoveryError);
  const recoveryRef = useRef<RecoveryState>(computeInitialRecoveryState());
  const setRecoveryBoth = useCallback((v: RecoveryState) => {
    recoveryRef.current = v;
    setRecovery(v);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    // Recovery-link state was captured synchronously at module load (before
    // supabase-js consumed/stripped the URL hash) — see lib/supabase.ts.
    // PKCE client + recovery links: the hash tokens are captured at module
    // load and the URL already stripped, so re-establish the recovery session
    // on the SAME client via auth.setSession() (server-validated: expired /
    // revoked links land in 'invalid'). All state updates below are async
    // continuations — never synchronous setState in the effect body.
    if (initialRecoveryLink.intent && !initialRecoveryLink.error && initialRecoveryTokens) {
      void client.auth
        .setSession({
          access_token: initialRecoveryTokens.access_token,
          refresh_token: initialRecoveryTokens.refresh_token,
        })
        .then(({ error }) => {
          if (cancelled) return;
          if (error) {
            setRecoveryError(RECOVERY_LINK_EXPIRED_MESSAGE);
            setRecoveryBoth('invalid');
            return;
          }
          setRecoveryBoth('active');
        })
        .catch(() => {
          if (cancelled) return;
          setRecoveryError(RECOVERY_LINK_EXPIRED_MESSAGE);
          setRecoveryBoth('invalid');
        });
    }

    const applySession = async (session: import('@supabase/supabase-js').Session | null) => {
      // Recovery flow owns the screen while it is pending/active — never run
      // the role gate against a recovery session (a Customer must also be
      // able to finish resetting THEIR password; the gate resumes at login).
      if (recoveryRef.current === 'pending' || recoveryRef.current === 'active') return;
      const seq = ++authVerifySeq.current;
      if (!session?.user) {
        if (!cancelled) {
          clearProtectedStateForCurrentUser();
          setIsLoggedIn(false);
          setAuthReady(true);
        }
        return;
      }

      // Server-side token validation. A session that still sits in storage
      // but is invalid/expired/revoked on the server must clear protected
      // state and return to login. Transient failures (offline) keep the
      // session — RLS still enforces every query server-side.
      let userId = session.user.id;
      try {
        const { data: checkedUser, error: userError } = await client.auth.getUser();
        if (userError) {
          const definitiveRejection =
            userError.name === 'AuthSessionMissingError' ||
            (typeof (userError as { status?: number }).status === 'number' &&
              ((userError as { status?: number }).status === 401 ||
                (userError as { status?: number }).status === 403)) ||
            /invalid|expired|revoked|not found/i.test(userError.message ?? '');
          if (definitiveRejection) {
            await client.auth.signOut({ scope: 'local' }).catch(() => {});
            if (!cancelled && seq === authVerifySeq.current) {
              clearProtectedStateForCurrentUser();
              setIsLoggedIn(false);
              setAuthReady(true);
            }
            return;
          }
        } else if (checkedUser.user) {
          userId = checkedUser.user.id;
        }
      } catch {
        // Network-level throw — treat as transient, keep the session.
      }
      if (cancelled || seq !== authVerifySeq.current) return;

      const check = await checkGrowthPartnerAccess(client, userId);
      if (cancelled || seq !== authVerifySeq.current) return;
      if (check.state === 'denied') {
        // Authenticated but not authorized for this app (e.g. a Customer
        // account) — kill the session so no surface is reachable. Global
        // revoke first (hygiene), then a guaranteed LOCAL wipe: a stale
        // token must never survive this gate, even when the server-side
        // session family is already dead and the logout API returns 403.
        await client.auth.signOut({ scope: 'global' }).catch(() => {});
        await client.auth.signOut({ scope: 'local' }).catch(() => {});
        if (!cancelled) {
          clearProtectedStateForCurrentUser();
          setIsLoggedIn(false);
          setAuthReady(true);
        }
        return;
      }
      // 'authorized' → enter. 'unknown' (offline/transient failure) → keep
      // the session: RLS still enforces every query server-side.
      authorizedUserIdRef.current = userId;
      setIsLoggedIn(true);
      setAuthReady(true);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        // Race fix: the recovery session may have been established before
        // React subscribed (setSession completes early). If a recovery link
        // is pending and a session already exists, it IS the recovery
        // session — unlock the form.
        if (recoveryRef.current === 'pending' && data.session) {
          setRecoveryBoth('active');
          return;
        }
        void applySession(data.session);
      })
      .catch(() => {
        if (!cancelled) setAuthReady(true);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setRecoveryBoth('active');
        return;
      }
      // SIGNED_OUT / USER_DELETED: session is gone (logout, expiry, revoke,
      // failed refresh). Clear protected state and land on /auth/login.
      // (USER_DELETED is compared as a widened string: newer auth-js versions
      // emit it, the installed one does not yet expose it in the union.)
      if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
        clearProtectedStateForCurrentUser();
        setIsLoggedIn(false);
        setAuthReady(true);
        return;
      }
      // TOKEN_REFRESHED: a successful refresh keeps the existing authorized
      // state; a refresh that produced NO session means the session expired
      // and could not be renewed → treat exactly like SIGNED_OUT.
      if (event === 'TOKEN_REFRESHED') {
        if (session) {
          setAuthReady(true);
        } else {
          clearProtectedStateForCurrentUser();
          setIsLoggedIn(false);
          setAuthReady(true);
        }
        return;
      }
      void applySession(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [setRecoveryBoth]);

  // URL contract: signed OUT → /auth/login; signed IN → leave /auth/*.
  // Both transitions are replaceState-based (lib/authRedirect.ts), so the
  // effect can never re-trigger itself — no redirect loops.
  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn) restoreFromLogin();
    else redirectToLogin();
  }, [authReady, isLoggedIn]);

  // Nexora authenticated location synchronization. Inert unless signed in
  // (and not mid password-recovery). The hook owns the single background GPS
  // watcher and stops it on SIGNED_OUT/unmount — see hooks/useLocationSync.
  useLocationSync({ enabled: isLoggedIn && authReady && recovery === 'none' });

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [history, setHistory] = useState<string[]>(['dashboard']);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // No more fake seeded demo profile / dashboard cache — the dashboard reads
  // the signed-in partner's live data from Supabase.

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


  if (supabaseConfigError) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-lg font-bold text-[#1b1c1b]">Configuration required</h1>
          <p className="text-sm leading-6 text-gray-600">{supabaseConfigError}</p>
        </div>
      </div>
    );
  }

  // Password-recovery surface takes over the whole app while a reset link is
  // being verified or used. After completion/cancel the (now-stale) recovery
  // session is destroyed and the normal login gate resumes.
  if (recovery === 'pending' || recovery === 'active' || recovery === 'invalid') {
    const endRecovery = () => {
      if (supabase) {
        void supabase.auth.signOut({ scope: 'global' }).catch(() => {});
        void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        clearAllAuthStorage();
      }
      clearProtectedStateForCurrentUser();
      setRecoveryBoth('none');
      setRecoveryError(null);
      setIsLoggedIn(false);
      setAuthReady(true);
    };
    return (
      <ResetPasswordScreen
        verifying={recovery === 'pending'}
        initialError={recovery === 'invalid' ? recoveryError : null}
        onCompleted={endRecovery}
        onExit={endRecovery}
      />
    );
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-pink-200 border-t-primary animate-spin" />
        <p className="text-xs font-semibold text-gray-400">Loading Nexora Growth Partner…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoginForm onLoginSuccess={() => {
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
        onComplete={() => navigateTo('website-onboarding')} 
      />;
    }

    if (currentPage === 'website-onboarding') {
      return <WebsiteOnboardingScreen onBack={goBack} onNavigate={navigateTo} />;
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
          setIsLoggedIn(false);
          void supabase?.auth.signOut();
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
        setIsLoggedIn(false);
        void supabase?.auth.signOut();
      }} />;
  };

  const isFullHeightScreen = FULL_HEIGHT_SCREENS.has(currentPage);

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
      {/* The Website Onboarding wizard manages its own internal scrolling and
          needs the full remaining height, so it bypasses the page scroller. */}
      {isFullHeightScreen ? (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <Suspense fallback={<ScreenLoader />}>
            {renderContent()}
          </Suspense>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
          <div className="min-h-full w-full shadow-lg bg-[#fcf9f8] relative flex flex-col overflow-x-hidden">
            <Suspense fallback={<ScreenLoader />}>
              {renderContent()}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
