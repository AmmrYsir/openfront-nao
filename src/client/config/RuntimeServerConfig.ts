export interface RuntimeServerConfig {
  numWorkers(): number;
  workerPath(gameID: string): string;
  jwtIssuer(): string;
}

function simpleHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export class BrowserRuntimeServerConfig implements RuntimeServerConfig {
  private readonly workers: number;
  private readonly issuer: string;

  constructor(workers: number, issuer: string) {
    this.workers = Math.max(1, Math.floor(workers));
    this.issuer = issuer;
  }

  numWorkers(): number {
    return this.workers;
  }

  workerPath(gameID: string): string {
    const workerIndex = simpleHash(gameID) % this.workers;
    return `/w${workerIndex}`;
  }

  jwtIssuer(): string {
    return this.issuer;
  }
}

export function resolveBrowserRuntimeServerConfig(): RuntimeServerConfig {
  if (typeof window === "undefined") {
    return new BrowserRuntimeServerConfig(1, "http://localhost:8787");
  }

  const query = new URLSearchParams(window.location.search);
  const workers = Number.parseInt(query.get("workers") ?? "1", 10);
  const issuer =
    query.get("issuer") ??
    `${window.location.protocol === "https:" ? "https" : "http"}://${window.location.host}`;

  return new BrowserRuntimeServerConfig(
    Number.isFinite(workers) ? workers : 1,
    issuer,
  );
}

export function pickRandomWorkerPath(numWorkers: number): string {
  const workers = Math.max(1, Math.floor(numWorkers));
  const workerIndex = Math.floor(Math.random() * workers);
  return `/w${workerIndex}`;
}
