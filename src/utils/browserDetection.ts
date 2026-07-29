export type InstallHelpTab = 'android' | 'ios' | 'chrome' | 'safari' | 'desktop';

export interface DeviceBrowserInfo {
  os: 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'other';
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'other';
  isMobile: boolean;
  recommendedHelpTab: InstallHelpTab;
  browserName: string;
  osName: string;
}

/**
 * Automatically detects the user's browser and operating system to pre-select
 * the correct 'helpTab' in the installation modal for an optimal user experience.
 */
export function detectBrowserAndOS(): DeviceBrowserInfo {
  if (typeof window === 'undefined' || !navigator) {
    return {
      os: 'other',
      browser: 'other',
      isMobile: false,
      recommendedHelpTab: 'android',
      browserName: 'Unknown Browser',
      osName: 'Unknown OS',
    };
  }

  const ua = navigator.userAgent || navigator.vendor || '';
  const platform = navigator.platform || '';

  // Operating System Detection
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMacOS = /Macintosh|Mac OS X/i.test(ua) && !isIOS;
  const isWindows = /Windows/i.test(ua);
  const isLinux = /Linux/i.test(ua) && !isAndroid;

  let os: DeviceBrowserInfo['os'] = 'other';
  let osName = 'Unknown OS';

  if (isIOS) {
    os = 'ios';
    osName = 'iOS (iPhone/iPad)';
  } else if (isAndroid) {
    os = 'android';
    osName = 'Android';
  } else if (isMacOS) {
    os = 'macos';
    osName = 'macOS';
  } else if (isWindows) {
    os = 'windows';
    osName = 'Windows';
  } else if (isLinux) {
    os = 'linux';
    osName = 'Linux';
  }

  // Browser Detection
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge && !isSamsung;
  const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge && !isSamsung;

  let browser: DeviceBrowserInfo['browser'] = 'other';
  let browserName = 'Web Browser';

  if (isSamsung) {
    browser = 'samsung';
    browserName = 'Samsung Internet';
  } else if (isEdge) {
    browser = 'edge';
    browserName = 'Microsoft Edge';
  } else if (isFirefox) {
    browser = 'firefox';
    browserName = 'Mozilla Firefox';
  } else if (isChrome) {
    browser = 'chrome';
    browserName = 'Google Chrome';
  } else if (isSafari) {
    browser = 'safari';
    browserName = 'Apple Safari';
  }

  const isMobile = isIOS || isAndroid || /Mobile|Tablet/i.test(ua);

  // Determine recommended initial helpTab
  let recommendedHelpTab: InstallHelpTab = 'android';

  if (isIOS) {
    recommendedHelpTab = 'ios';
  } else if (isAndroid) {
    recommendedHelpTab = 'android';
  } else if (isSafari) {
    recommendedHelpTab = 'safari';
  } else if (isChrome && !isMobile) {
    recommendedHelpTab = 'desktop';
  } else if (isChrome) {
    recommendedHelpTab = 'chrome';
  } else if (!isMobile) {
    recommendedHelpTab = 'desktop';
  }

  return {
    os,
    browser,
    isMobile,
    recommendedHelpTab,
    browserName,
    osName,
  };
}
