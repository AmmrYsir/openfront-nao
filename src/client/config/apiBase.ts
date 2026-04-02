export interface ApiBaseResolutionOptions {
  hostname?: string;
  origin?: string;
  apiDomainOverride?: string | null;
  localhostApiHost?: string | null;
}

const DEFAULT_LOCAL_API_BASE = "http://localhost:8787";

export function deriveAudienceFromHostname(hostname: string): string {
  const segments = hostname.split(".").filter((segment) => segment.length > 0);
  if (segments.length >= 2) {
    return segments.slice(-2).join(".");
  }
  return hostname;
}

export function resolveApiBase(
  options?: ApiBaseResolutionOptions,
): string {
  const hostname =
    options?.hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "localhost");
  const audience = deriveAudienceFromHostname(hostname);

  if (audience === "localhost") {
    if (options?.apiDomainOverride && options.apiDomainOverride.length > 0) {
      return `https://${options.apiDomainOverride}`;
    }

    if (options?.localhostApiHost && options.localhostApiHost.length > 0) {
      return options.localhostApiHost;
    }

    if (typeof localStorage !== "undefined") {
      const localHost = localStorage.getItem("apiHost");
      if (localHost && localHost.length > 0) {
        return localHost;
      }
    }

    return DEFAULT_LOCAL_API_BASE;
  }

  return `https://api.${audience}`;
}

export function getAudience(): string {
  if (typeof window === "undefined") {
    return "localhost";
  }
  return deriveAudienceFromHostname(window.location.hostname);
}
