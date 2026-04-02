interface SoloPageControllerOptions {
  host: HTMLElement;
  onQueueTurn: () => Promise<void>;
  onStartAutoQueue: () => Promise<void>;
  onStopAutoQueue: () => void;
  onStatus?: (status: string) => void;
}

export class SoloPageController {
  private readonly host: HTMLElement;
  private readonly onQueueTurn: () => Promise<void>;
  private readonly onStartAutoQueue: () => Promise<void>;
  private readonly onStopAutoQueue: () => void;
  private readonly onStatus?: (status: string) => void;

  private queueButton: HTMLButtonElement | null = null;
  private startButton: HTMLButtonElement | null = null;
  private stopButton: HTMLButtonElement | null = null;
  private autoStateNode: HTMLElement | null = null;
  private isAutoRunning = false;

  constructor(options: SoloPageControllerOptions) {
    this.host = options.host;
    this.onQueueTurn = options.onQueueTurn;
    this.onStartAutoQueue = options.onStartAutoQueue;
    this.onStopAutoQueue = options.onStopAutoQueue;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
    this.applyAutoState(false);
  }

  async hydrate(): Promise<void> {
    this.onStatus?.("Solo controls ready.");
  }

  dispose(): void {
    this.queueButton?.removeEventListener("click", this.handleQueueOneTurn);
    this.startButton?.removeEventListener("click", this.handleStartAutoQueue);
    this.stopButton?.removeEventListener("click", this.handleStopAutoQueue);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--solo">
        <header class="panel-head">
          <h2>Solo Runtime</h2>
          <p class="panel-subtitle">
            Local singleplayer runtime controls while full legacy solo flow migration is in progress.
          </p>
        </header>

        <div class="row-inline">
          <button type="button" data-solo-start>Start Auto Turns</button>
          <button type="button" data-solo-stop>Stop Auto Turns</button>
          <button type="button" data-solo-queue>Queue One Turn</button>
        </div>

        <p class="meta-pill">Auto queue: <strong data-solo-auto-state>off</strong></p>
      </section>
    `;
  }

  private bind(): void {
    this.queueButton = this.host.querySelector<HTMLButtonElement>("[data-solo-queue]");
    this.startButton = this.host.querySelector<HTMLButtonElement>("[data-solo-start]");
    this.stopButton = this.host.querySelector<HTMLButtonElement>("[data-solo-stop]");
    this.autoStateNode = this.host.querySelector<HTMLElement>("[data-solo-auto-state]");

    this.queueButton?.addEventListener("click", this.handleQueueOneTurn);
    this.startButton?.addEventListener("click", this.handleStartAutoQueue);
    this.stopButton?.addEventListener("click", this.handleStopAutoQueue);
  }

  private applyAutoState(isRunning: boolean): void {
    this.isAutoRunning = isRunning;
    if (this.autoStateNode) {
      this.autoStateNode.textContent = isRunning ? "on" : "off";
    }
    if (this.startButton) {
      this.startButton.disabled = isRunning;
    }
    if (this.stopButton) {
      this.stopButton.disabled = !isRunning;
    }
  }

  private readonly handleQueueOneTurn = (): void => {
    void (async () => {
      this.onStatus?.("Queueing one solo turn...");
      await this.onQueueTurn();
      this.onStatus?.("Queued one solo turn.");
    })();
  };

  private readonly handleStartAutoQueue = (): void => {
    void (async () => {
      if (this.isAutoRunning) {
        return;
      }
      this.onStatus?.("Starting solo auto-queue...");
      await this.onStartAutoQueue();
      this.applyAutoState(true);
      this.onStatus?.("Solo auto-queue running.");
    })();
  };

  private readonly handleStopAutoQueue = (): void => {
    if (!this.isAutoRunning) {
      return;
    }
    this.onStopAutoQueue();
    this.applyAutoState(false);
    this.onStatus?.("Solo auto-queue stopped.");
  };
}
