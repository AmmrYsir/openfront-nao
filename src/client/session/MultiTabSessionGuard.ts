interface MultiTabLock {
  owner: string;
  timestamp: number;
}

export interface MultiTabSessionGuardOptions {
  lockKey?: string;
  heartbeatIntervalMs?: number;
  staleThresholdMs?: number;
  cooldownMs?: number;
  storage?: Storage;
  now?: () => number;
}

export class MultiTabSessionGuard {
  private readonly tabId: string;
  private readonly lockKey: string;
  private readonly heartbeatIntervalMs: number;
  private readonly staleThresholdMs: number;
  private readonly cooldownMs: number;
  private readonly storage: Storage;
  private readonly now: () => number;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private punished = false;
  private penaltyListener: (durationMs: number) => void = () => {};

  constructor(options?: MultiTabSessionGuardOptions) {
    this.tabId = `${Date.now()}-${Math.random()}`;
    this.lockKey = options?.lockKey ?? "multi-tab-lock";
    this.heartbeatIntervalMs = options?.heartbeatIntervalMs ?? 1000;
    this.staleThresholdMs = options?.staleThresholdMs ?? 3000;
    this.cooldownMs = options?.cooldownMs ?? 10_000;
    this.storage = options?.storage ?? localStorage;
    this.now = options?.now ?? Date.now;
  }

  startMonitoring(onPenalty: (durationMs: number) => void): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.penaltyListener = onPenalty;
    window.addEventListener("storage", this.handleStorage);
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    this.writeLock();
    this.heartbeatTimer = setInterval(() => {
      this.heartbeat();
    }, this.heartbeatIntervalMs);
  }

  stopMonitoring(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    window.removeEventListener("storage", this.handleStorage);
    window.removeEventListener("beforeunload", this.handleBeforeUnload);

    const lock = this.readLock();
    if (lock?.owner === this.tabId) {
      this.storage.removeItem(this.lockKey);
    }
  }

  private heartbeat(): void {
    const lock = this.readLock();
    const now = this.now();

    if (!lock || lock.owner === this.tabId || now - lock.timestamp > this.staleThresholdMs) {
      this.writeLock();
      this.punished = false;
      return;
    }

    if (!this.punished) {
      this.applyPenalty();
    }
  }

  private readonly handleStorage = (event: StorageEvent): void => {
    if (event.key !== this.lockKey || !event.newValue) {
      return;
    }

    const lock = this.parseLock(event.newValue);
    if (!lock || lock.owner === this.tabId || this.punished) {
      return;
    }

    this.applyPenalty();
  };

  private readonly handleBeforeUnload = (): void => {
    const lock = this.readLock();
    if (lock?.owner === this.tabId) {
      this.storage.removeItem(this.lockKey);
    }
  };

  private applyPenalty(): void {
    this.punished = true;
    this.penaltyListener(this.cooldownMs);
    setTimeout(() => {
      this.punished = false;
    }, this.cooldownMs);
  }

  private writeLock(): void {
    const lock: MultiTabLock = {
      owner: this.tabId,
      timestamp: this.now(),
    };
    this.storage.setItem(this.lockKey, JSON.stringify(lock));
  }

  private readLock(): MultiTabLock | null {
    const raw = this.storage.getItem(this.lockKey);
    if (!raw) {
      return null;
    }
    return this.parseLock(raw);
  }

  private parseLock(raw: string): MultiTabLock | null {
    try {
      const parsed = JSON.parse(raw) as Partial<MultiTabLock>;
      if (typeof parsed.owner !== "string") {
        return null;
      }
      if (typeof parsed.timestamp !== "number") {
        return null;
      }
      return {
        owner: parsed.owner,
        timestamp: parsed.timestamp,
      };
    } catch {
      return null;
    }
  }
}
