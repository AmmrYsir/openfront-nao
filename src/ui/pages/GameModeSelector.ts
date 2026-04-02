interface GameModeSelectorOptions {
  host: HTMLElement;
  onOpenSinglePlayer: () => void;
  onNavigateToPage: (pageId: string) => void;
  onStatus?: (status: string) => void;
}

type ModeAction = "solo-config" | "solo-runtime" | "classic" | "lobby" | "leaderboard";

export class GameModeSelector {
  private readonly host: HTMLElement;
  private readonly onOpenSinglePlayer: () => void;
  private readonly onNavigateToPage: (pageId: string) => void;
  private readonly onStatus?: (status: string) => void;

  constructor(options: GameModeSelectorOptions) {
    this.host = options.host;
    this.onOpenSinglePlayer = options.onOpenSinglePlayer;
    this.onNavigateToPage = options.onNavigateToPage;
    this.onStatus = options.onStatus;
    this.render();
    this.host.addEventListener("click", this.handleClick);
  }

  async hydrate(): Promise<void> {
    this.onStatus?.("Mode selector ready.");
  }

  dispose(): void {
    this.host.removeEventListener("click", this.handleClick);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--modes">
        <header class="panel-head">
          <h2>Game Modes</h2>
          <p class="panel-subtitle">
            Native mode hub restored in the new UI. Start solo setup, jump into runtime, or use classic full gameplay.
          </p>
        </header>
        <div class="mode-grid">
          <button type="button" class="mode-card mode-card--primary" data-mode-action="solo-config">
            <span class="mode-card-title">Solo Setup</span>
            <span class="mode-card-subtitle">Singleplayer map and rules</span>
          </button>
          <button type="button" class="mode-card" data-mode-action="solo-runtime">
            <span class="mode-card-title">Solo Runtime</span>
            <span class="mode-card-subtitle">Deterministic local worker</span>
          </button>
          <button type="button" class="mode-card" data-mode-action="classic">
            <span class="mode-card-title">Classic UI</span>
            <span class="mode-card-subtitle">Full legacy frontend parity</span>
          </button>
          <button type="button" class="mode-card" data-mode-action="lobby">
            <span class="mode-card-title">Public Lobbies</span>
            <span class="mode-card-subtitle">Realtime listing and queue</span>
          </button>
          <button type="button" class="mode-card" data-mode-action="leaderboard">
            <span class="mode-card-title">Leaderboard</span>
            <span class="mode-card-subtitle">Ranked standings</span>
          </button>
        </div>
      </section>
    `;
  }

  private readonly handleClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const actionNode = target?.closest<HTMLButtonElement>("[data-mode-action]");
    if (!actionNode) {
      return;
    }

    const action = actionNode.dataset.modeAction as ModeAction | undefined;
    switch (action) {
      case "solo-config":
        this.onOpenSinglePlayer();
        this.onStatus?.("Opening singleplayer setup...");
        return;
      case "solo-runtime":
        this.onNavigateToPage("page-solo");
        this.onStatus?.("Showing solo runtime controls.");
        return;
      case "classic":
        this.onNavigateToPage("page-classic");
        this.onStatus?.("Switching to classic gameplay UI.");
        return;
      case "lobby":
        this.onNavigateToPage("page-lobby");
        this.onStatus?.("Opening public lobby page.");
        return;
      case "leaderboard":
        this.onNavigateToPage("page-leaderboard");
        this.onStatus?.("Opening leaderboard page.");
        return;
      default:
        return;
    }
  };
}
