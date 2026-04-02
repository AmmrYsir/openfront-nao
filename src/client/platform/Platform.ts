export type PlatformName =
  | "Windows"
  | "macOS"
  | "iOS"
  | "Android"
  | "Linux"
  | "Unknown";

export interface PlatformSnapshot {
  os: PlatformName;
  isMac: boolean;
  isWindows: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isLinux: boolean;
  isElectron: boolean;
  isMobileWidth: boolean;
  isTabletWidth: boolean;
  isDesktopWidth: boolean;
}

export function normalizePlatformName(platform: string): PlatformName {
  const normalized = platform.toLowerCase();
  if (normalized.includes("windows")) return "Windows";
  if (
    normalized.includes("iphone") ||
    normalized.includes("ipad") ||
    normalized.includes("ipod") ||
    normalized.includes("ios")
  ) {
    return "iOS";
  }
  if (
    normalized.includes("mac") ||
    normalized.includes("macintosh") ||
    normalized.includes("macos")
  ) {
    return "macOS";
  }
  if (normalized.includes("android")) return "Android";
  if (normalized.includes("chrome os")) return "Linux";
  if (normalized.includes("linux")) return "Linux";
  return "Unknown";
}

export interface BrowserLike {
  readonly userAgent: string;
  readonly maxTouchPoints?: number;
  readonly userAgentData?: {
    platform?: string;
  };
}

export function inferOsFromUserAgent(navigatorLike: BrowserLike): PlatformName {
  const uaDataPlatform = navigatorLike.userAgentData?.platform;
  if (uaDataPlatform) {
    return normalizePlatformName(uaDataPlatform);
  }

  const ua = navigatorLike.userAgent;
  if (/windows nt/i.test(ua)) return "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (
    /mac os x/i.test(ua) &&
    ((navigatorLike.maxTouchPoints ?? 0) > 1 || /ipad/i.test(ua))
  ) {
    return "iOS";
  }
  if (/mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}

function detectElectron(
  navigatorLike: BrowserLike | null,
  processLike: unknown,
  windowLike: unknown,
): boolean {
  const rendererProcessType =
    typeof windowLike === "object" &&
    windowLike !== null &&
    typeof (windowLike as { process?: { type?: string } }).process === "object"
      ? (windowLike as { process?: { type?: string } }).process?.type
      : undefined;
  if (rendererProcessType === "renderer") {
    return true;
  }

  const processVersions =
    typeof processLike === "object" && processLike !== null
      ? (processLike as { versions?: { electron?: string } }).versions
      : undefined;
  if (processVersions?.electron) {
    return true;
  }

  if (navigatorLike && navigatorLike.userAgent.includes("Electron")) {
    return true;
  }

  return false;
}

export function createPlatformSnapshot(): PlatformSnapshot {
  const hasWindow = typeof window !== "undefined";
  const hasNavigator = typeof navigator !== "undefined";
  const navigatorLike = hasNavigator ? (navigator as BrowserLike) : null;
  const os = navigatorLike ? inferOsFromUserAgent(navigatorLike) : "Unknown";

  const width = hasWindow ? window.innerWidth : 0;
  const isMobileWidth = hasWindow ? width < 768 : false;
  const isTabletWidth = hasWindow ? width >= 768 && width < 1024 : false;
  const isDesktopWidth = hasWindow ? width >= 1024 : false;

  const processLike =
    typeof globalThis === "object" &&
    "process" in globalThis &&
    typeof (globalThis as { process?: unknown }).process === "object"
      ? (globalThis as { process?: unknown }).process
      : null;

  return {
    os,
    isMac: os === "macOS",
    isWindows: os === "Windows",
    isIOS: os === "iOS",
    isAndroid: os === "Android",
    isLinux: os === "Linux",
    isElectron: detectElectron(
      navigatorLike,
      processLike,
      hasWindow ? window : null,
    ),
    isMobileWidth,
    isTabletWidth,
    isDesktopWidth,
  };
}
