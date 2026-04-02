import {
  type LocalServer,
  type LocalSoloConfig,
  normalizeSoloConfig,
} from "../../client/solo/LocalServer";

interface SinglePlayerModalOptions {
  host: HTMLElement;
  localServer: LocalServer;
  onNavigateToPage: (pageId: string) => void;
  onStartAutoQueue?: () => Promise<void>;
  onStatus?: (status: string) => void;
}

const MAP_CHOICES: ReadonlyArray<{ label: string; value: string }> = [
  { label: "World", value: "World" },
  { label: "Europe", value: "Europe" },
  { label: "North America", value: "North America" },
  { label: "South America", value: "South America" },
  { label: "Asia", value: "Asia" },
  { label: "Africa", value: "Africa" },
  { label: "Oceania", value: "Oceania" },
];

export class SinglePlayerModal {
  private readonly host: HTMLElement;
  private readonly localServer: LocalServer;
  private readonly onNavigateToPage: (pageId: string) => void;
  private readonly onStartAutoQueue?: () => Promise<void>;
  private readonly onStatus?: (status: string) => void;

  private overlay: HTMLElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private cancelButton: HTMLButtonElement | null = null;
  private startRuntimeButton: HTMLButtonElement | null = null;
  private startClassicButton: HTMLButtonElement | null = null;
  private mapSelect: HTMLSelectElement | null = null;
  private mapSizeSelect: HTMLSelectElement | null = null;
  private botsInput: HTMLInputElement | null = null;
  private modeSelect: HTMLSelectElement | null = null;
  private teamCountSelect: HTMLSelectElement | null = null;
  private isOpen = false;

  constructor(options: SinglePlayerModalOptions) {
    this.host = options.host;
    this.localServer = options.localServer;
    this.onNavigateToPage = options.onNavigateToPage;
    this.onStartAutoQueue = options.onStartAutoQueue;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
  }

  async hydrate(): Promise<void> {
    this.applyConfig(this.localServer.getDefaultConfig());
  }

  open(): void {
    this.isOpen = true;
    this.overlay?.removeAttribute("hidden");
    this.overlay?.setAttribute("aria-hidden", "false");
    this.onStatus?.("Singleplayer setup opened.");
  }

  close(): void {
    this.isOpen = false;
    this.overlay?.setAttribute("hidden", "");
    this.overlay?.setAttribute("aria-hidden", "true");
  }

  dispose(): void {
    this.closeButton?.removeEventListener("click", this.handleClose);
    this.cancelButton?.removeEventListener("click", this.handleClose);
    this.startRuntimeButton?.removeEventListener("click", this.handleStartRuntime);
    this.startClassicButton?.removeEventListener("click", this.handleStartClassic);
    this.modeSelect?.removeEventListener("change", this.handleModeChanged);
    this.overlay?.removeEventListener("click", this.handleBackdropClick);
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleWindowKeyDown);
    }
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="solo-modal-layer" data-solo-modal hidden aria-hidden="true">
        <article class="solo-modal-card" role="dialog" aria-modal="true" aria-label="Singleplayer Setup">
          <header class="solo-modal-head">
            <h2>Singleplayer Setup</h2>
            <button type="button" class="solo-modal-close" data-solo-modal-close aria-label="Close">×</button>
          </header>
          <p class="panel-subtitle">
            Native phase-3 setup flow. You can launch the new runtime or switch to full classic gameplay.
          </p>

          <section class="field-group">
            <label class="field-label" for="solo-map-select">Map</label>
            <select id="solo-map-select" data-solo-map>
              ${MAP_CHOICES.map((choice) => `<option value="${choice.value}">${choice.label}</option>`).join("")}
            </select>
          </section>

          <section class="row-inline row-inline--spread">
            <section class="field-group">
              <label class="field-label" for="solo-size-select">Map Size</label>
              <select id="solo-size-select" data-solo-size>
                <option value="normal">Normal</option>
                <option value="compact">Compact</option>
              </select>
            </section>
            <section class="field-group">
              <label class="field-label" for="solo-bots-input">Bots</label>
              <input id="solo-bots-input" data-solo-bots type="number" min="0" max="400" step="1" value="80" />
            </section>
          </section>

          <section class="row-inline row-inline--spread">
            <section class="field-group">
              <label class="field-label" for="solo-mode-select">Mode</label>
              <select id="solo-mode-select" data-solo-mode>
                <option value="ffa">FFA</option>
                <option value="team">Team</option>
              </select>
            </section>
            <section class="field-group">
              <label class="field-label" for="solo-teams-select">Teams</label>
              <select id="solo-teams-select" data-solo-teams>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </section>
          </section>

          <div class="row-inline">
            <button type="button" data-solo-start-runtime>Start In New Runtime</button>
            <button type="button" data-solo-start-classic>Open In Classic UI</button>
            <button type="button" class="mode-card--ghost" data-solo-cancel>Cancel</button>
          </div>
        </article>
      </section>
    `;
  }

  private bind(): void {
    this.overlay = this.host.querySelector<HTMLElement>("[data-solo-modal]");
    this.closeButton = this.host.querySelector<HTMLButtonElement>("[data-solo-modal-close]");
    this.cancelButton = this.host.querySelector<HTMLButtonElement>("[data-solo-cancel]");
    this.startRuntimeButton = this.host.querySelector<HTMLButtonElement>(
      "[data-solo-start-runtime]",
    );
    this.startClassicButton = this.host.querySelector<HTMLButtonElement>(
      "[data-solo-start-classic]",
    );
    this.mapSelect = this.host.querySelector<HTMLSelectElement>("[data-solo-map]");
    this.mapSizeSelect = this.host.querySelector<HTMLSelectElement>("[data-solo-size]");
    this.botsInput = this.host.querySelector<HTMLInputElement>("[data-solo-bots]");
    this.modeSelect = this.host.querySelector<HTMLSelectElement>("[data-solo-mode]");
    this.teamCountSelect = this.host.querySelector<HTMLSelectElement>("[data-solo-teams]");

    this.closeButton?.addEventListener("click", this.handleClose);
    this.cancelButton?.addEventListener("click", this.handleClose);
    this.startRuntimeButton?.addEventListener("click", this.handleStartRuntime);
    this.startClassicButton?.addEventListener("click", this.handleStartClassic);
    this.modeSelect?.addEventListener("change", this.handleModeChanged);
    this.overlay?.addEventListener("click", this.handleBackdropClick);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleWindowKeyDown);
    }
  }

  private applyConfig(config: LocalSoloConfig): void {
    if (this.mapSelect) {
      this.mapSelect.value = config.mapId;
      if (this.mapSelect.value !== config.mapId) {
        this.mapSelect.value = "World";
      }
    }
    if (this.mapSizeSelect) {
      this.mapSizeSelect.value = config.mapSize;
    }
    if (this.botsInput) {
      this.botsInput.value = `${config.bots}`;
    }
    if (this.modeSelect) {
      this.modeSelect.value = config.mode;
    }
    if (this.teamCountSelect) {
      this.teamCountSelect.value = `${config.teamCount}`;
    }
    this.applyModeUi();
  }

  private collectConfig(): LocalSoloConfig {
    const raw = {
      mapId: this.mapSelect?.value ?? "World",
      mapSize: this.mapSizeSelect?.value === "compact" ? "compact" : "normal",
      bots: Number.parseInt(this.botsInput?.value ?? "80", 10),
      mode: this.modeSelect?.value === "team" ? "team" : "ffa",
      teamCount: Number.parseInt(this.teamCountSelect?.value ?? "2", 10),
    };
    return normalizeSoloConfig(raw);
  }

  private applyModeUi(): void {
    if (!this.modeSelect || !this.teamCountSelect) {
      return;
    }
    const isTeam = this.modeSelect.value === "team";
    this.teamCountSelect.disabled = !isTeam;
  }

  private readonly handleModeChanged = (): void => {
    this.applyModeUi();
  };

  private readonly handleClose = (): void => {
    this.close();
  };

  private readonly handleBackdropClick = (event: Event): void => {
    if (event.target === this.overlay) {
      this.close();
    }
  };

  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen || event.key !== "Escape") {
      return;
    }
    this.close();
  };

  private readonly handleStartRuntime = (): void => {
    void (async () => {
      const config = this.collectConfig();
      const session = this.localServer.createSession(config);
      const currentSearch = window.location.search;
      const nextSearch = this.localServer.buildRuntimeSearch(currentSearch, config);
      if (nextSearch !== currentSearch) {
        this.onStatus?.(
          `Launching ${session.gameID} on ${config.mapId} (${config.mapSize}) and reloading runtime...`,
        );
        window.location.search = nextSearch;
        return;
      }

      this.onNavigateToPage("page-solo");
      if (this.onStartAutoQueue) {
        await this.onStartAutoQueue();
      }
      this.onStatus?.(`Solo session ${session.gameID} started in new runtime.`);
      this.close();
    })();
  };

  private readonly handleStartClassic = (): void => {
    const config = this.collectConfig();
    const session = this.localServer.createSession(config);
    this.onNavigateToPage("page-classic");
    this.onStatus?.(`Solo session ${session.gameID} opened in classic UI.`);
    this.close();
  };
}
