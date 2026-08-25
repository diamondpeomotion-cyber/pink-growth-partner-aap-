// Client-side routing surface for the auth gate (no router library).
//
// The SPA is state-driven; the only URL contract is /auth/login:
//   - signed OUT  -> URL becomes /auth/login (login surface renders there)
//   - signed IN   -> any /auth/* path is restored to /
//
// Both transitions use history.replaceState, never pushState:
//   - no history spam, so the back button cannot ping-pong into a loop
//   - idempotent: re-running with an already-correct URL is a no-op
//
// Vercel rewrites every non-/api path to /index.html, so /auth/login deep
// links load the SPA directly.

export const AUTH_LOGIN_PATH = '/auth/login';

export const isLoginPath = (pathname: string): boolean =>
  pathname === AUTH_LOGIN_PATH || pathname.startsWith(`${AUTH_LOGIN_PATH}/`);

interface HistoryLike {
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void;
}

interface BrowserLike {
  location: { pathname: string };
  history: HistoryLike;
}

const NOOP_BROWSER: BrowserLike = {
  location: { pathname: '/' },
  history: { replaceState: () => {} },
};

const currentBrowser = (): BrowserLike =>
  typeof window !== 'undefined' ? (window as unknown as BrowserLike) : NOOP_BROWSER;

/**
 * Point the address bar at /auth/login when the user is signed out.
 * No-op when already there (this is what makes redirect loops impossible).
 * `browser` is injectable for offline verification; defaults to the real
 * window in the browser and to a no-op shim under SSR/tests.
 */
export const redirectToLogin = (browser: BrowserLike = currentBrowser()): void => {
  if (browser.location.pathname === AUTH_LOGIN_PATH) return;
  try {
    browser.history.replaceState(null, '', AUTH_LOGIN_PATH);
  } catch {
    /* history restricted (e.g. sandboxed iframe) — the login surface still renders */
  }
};

/**
 * Leave the login route once a session exists (login completed or a
 * persistent session was restored while the user opened /auth/login).
 */
export const restoreFromLogin = (browser: BrowserLike = currentBrowser()): void => {
  if (!isLoginPath(browser.location.pathname)) return;
  try {
    browser.history.replaceState(null, '', '/');
  } catch {
    /* ignore */
  }
};
