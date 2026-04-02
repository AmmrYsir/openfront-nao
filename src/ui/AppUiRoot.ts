import { bindPageRouterToDom, PageRouter } from "./navigation/PageRouter";

interface AppUiRootOptions {
  hasLiveTransport: boolean;
  onConnectLiveTransport?: () => void;
  onDisconnectLiveTransport?: () => void;
}

type LiveTransportState =
  | "disabled"
  | "disconnected"
  | "connecting"
  | "connected";

declare global {
  interface Window {
    currentPageId?: string;
    showPage?: (pageId: string) => void;
  }
}

export class AppUiRoot {
  private readonly root: HTMLElement;
  private readonly hudMount: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly accountStatusValue: HTMLElement | null;
  private readonly lobbyStatusValue: HTMLElement | null;
  private readonly leaderboardStatusValue: HTMLElement | null;
  private readonly settingsStatusValue: HTMLElement | null;
  private readonly newsStatusValue: HTMLElement | null;
  private readonly helpStatusValue: HTMLElement | null;
  private readonly accountPanelHost: HTMLElement | null;
  private readonly lobbyPanelHost: HTMLElement | null;
  private readonly leaderboardPanelHost: HTMLElement | null;
  private readonly settingsPanelHost: HTMLElement | null;
  private readonly newsPanelHost: HTMLElement | null;
  private readonly helpPanelHost: HTMLElement | null;
  private readonly connectButton: HTMLButtonElement | null;
  private readonly disconnectButton: HTMLButtonElement | null;
  private readonly hasLiveTransport: boolean;
  private readonly onConnectLiveTransport?: () => void;
  private readonly onDisconnectLiveTransport?: () => void;
  private readonly pageRouter = new PageRouter("page-play");
  private readonly detachPageBinding: () => void;
  private readonly detachPageObserver: () => void;

  constructor(host: HTMLElement, options: AppUiRootOptions) {
    this.hasLiveTransport = options.hasLiveTransport;
    this.onConnectLiveTransport = options.onConnectLiveTransport;
    this.onDisconnectLiveTransport = options.onDisconnectLiveTransport;

    host.innerHTML = `
      <div class="ui-root">
        <nav class="top-nav" aria-label="Main Navigation">
          <button class="nav-menu-item active" data-page="page-play" type="button">Play</button>
          <button class="nav-menu-item" data-page="page-account" type="button">Account</button>
          <button class="nav-menu-item" data-page="page-lobby" type="button">Lobby</button>
          <button class="nav-menu-item" data-page="page-leaderboard" type="button">Leaderboard</button>
          <button class="nav-menu-item" data-page="page-settings" type="button">Settings</button>
          <button class="nav-menu-item" data-page="page-news" type="button">News</button>
          <button class="nav-menu-item" data-page="page-help" type="button">Help</button>
        </nav>
        <section data-page-panel="page-play" id="page-play" class="page-panel active">
          <section class="transport-panel">
            <div class="transport-title">Runtime Status</div>
            <div id="transport-status" class="transport-status">Booting simulation runtime...</div>
            <div class="transport-controls">
              <button id="transport-connect" type="button">Connect Live Turns</button>
              <button id="transport-disconnect" type="button">Disconnect Live Turns</button>
            </div>
          </section>
          <section id="hud-mount"></section>
        </section>
        <section data-page-panel="page-account" id="page-account" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">Account status</span>
            <span id="account-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="account-panel-host"></div>
        </section>
        <section data-page-panel="page-lobby" id="page-lobby" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">Lobby status</span>
            <span id="lobby-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="lobby-panel-host"></div>
        </section>
        <section data-page-panel="page-leaderboard" id="page-leaderboard" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">Leaderboard status</span>
            <span id="leaderboard-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="leaderboard-panel-host"></div>
        </section>
        <section data-page-panel="page-settings" id="page-settings" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">Settings status</span>
            <span id="settings-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="settings-panel-host"></div>
        </section>
        <section data-page-panel="page-news" id="page-news" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">News status</span>
            <span id="news-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="news-panel-host"></div>
        </section>
        <section data-page-panel="page-help" id="page-help" class="page-panel" hidden>
          <div class="panel-status-row">
            <span class="panel-status-label">Help status</span>
            <span id="help-status" class="panel-status-value">Idle.</span>
          </div>
          <div id="help-panel-host"></div>
        </section>
      </div>
    `;

    this.root = host;

    const hudMount = host.querySelector<HTMLElement>("#hud-mount");
    const statusValue = host.querySelector<HTMLElement>("#transport-status");
    const accountStatusValue = host.querySelector<HTMLElement>("#account-status");
    const lobbyStatusValue = host.querySelector<HTMLElement>("#lobby-status");
    const leaderboardStatusValue =
      host.querySelector<HTMLElement>("#leaderboard-status");
    const settingsStatusValue =
      host.querySelector<HTMLElement>("#settings-status");
    const newsStatusValue = host.querySelector<HTMLElement>("#news-status");
    const helpStatusValue = host.querySelector<HTMLElement>("#help-status");
    const accountPanelHost =
      host.querySelector<HTMLElement>("#account-panel-host");
    const lobbyPanelHost = host.querySelector<HTMLElement>("#lobby-panel-host");
    const leaderboardPanelHost = host.querySelector<HTMLElement>(
      "#leaderboard-panel-host",
    );
    const settingsPanelHost =
      host.querySelector<HTMLElement>("#settings-panel-host");
    const newsPanelHost = host.querySelector<HTMLElement>("#news-panel-host");
    const helpPanelHost = host.querySelector<HTMLElement>("#help-panel-host");
    const connectButton =
      host.querySelector<HTMLButtonElement>("#transport-connect");
    const disconnectButton = host.querySelector<HTMLButtonElement>(
      "#transport-disconnect",
    );

    if (!hudMount || !statusValue) {
      throw new Error("Failed to initialize app UI root.");
    }

    this.hudMount = hudMount;
    this.statusValue = statusValue;
    this.accountStatusValue = accountStatusValue;
    this.lobbyStatusValue = lobbyStatusValue;
    this.leaderboardStatusValue = leaderboardStatusValue;
    this.settingsStatusValue = settingsStatusValue;
    this.newsStatusValue = newsStatusValue;
    this.helpStatusValue = helpStatusValue;
    this.accountPanelHost = accountPanelHost;
    this.lobbyPanelHost = lobbyPanelHost;
    this.leaderboardPanelHost = leaderboardPanelHost;
    this.settingsPanelHost = settingsPanelHost;
    this.newsPanelHost = newsPanelHost;
    this.helpPanelHost = helpPanelHost;
    this.connectButton = connectButton;
    this.disconnectButton = disconnectButton;

    this.connectButton?.addEventListener("click", this.handleConnectClick);
    this.disconnectButton?.addEventListener("click", this.handleDisconnectClick);
    this.root.addEventListener("click", this.handleNavigationClick);

    this.detachPageBinding = bindPageRouterToDom(this.pageRouter, host);
    this.detachPageObserver = this.pageRouter.onChange((pageId) => {
      if (typeof window !== "undefined") {
        window.currentPageId = pageId;
      }
      this.root.dispatchEvent(
        new CustomEvent("showPage", {
          detail: pageId,
          bubbles: true,
        }),
      );
    });

    if (typeof window !== "undefined") {
      window.currentPageId = this.pageRouter.getCurrentPageId();
      window.showPage = (pageId: string) => {
        this.pageRouter.showPage(pageId);
      };
    }

    this.setLiveTransportState(this.hasLiveTransport ? "disconnected" : "disabled");
  }

  getHudHost(): HTMLElement {
    return this.hudMount;
  }

  setStatus(text: string): void {
    this.statusValue.textContent = text;
  }

  setAccountStatus(text: string): void {
    if (!this.accountStatusValue) {
      return;
    }
    this.accountStatusValue.textContent = text;
  }

  setLobbyStatus(text: string): void {
    if (!this.lobbyStatusValue) {
      return;
    }
    this.lobbyStatusValue.textContent = text;
  }

  setLeaderboardStatus(text: string): void {
    if (!this.leaderboardStatusValue) {
      return;
    }
    this.leaderboardStatusValue.textContent = text;
  }

  setSettingsStatus(text: string): void {
    if (!this.settingsStatusValue) {
      return;
    }
    this.settingsStatusValue.textContent = text;
  }

  setNewsStatus(text: string): void {
    if (!this.newsStatusValue) {
      return;
    }
    this.newsStatusValue.textContent = text;
  }

  setHelpStatus(text: string): void {
    if (!this.helpStatusValue) {
      return;
    }
    this.helpStatusValue.textContent = text;
  }

  getAccountPanelHost(): HTMLElement {
    if (!this.accountPanelHost) {
      throw new Error("Missing account panel host.");
    }
    return this.accountPanelHost;
  }

  getLobbyPanelHost(): HTMLElement {
    if (!this.lobbyPanelHost) {
      throw new Error("Missing lobby panel host.");
    }
    return this.lobbyPanelHost;
  }

  getLeaderboardPanelHost(): HTMLElement {
    if (!this.leaderboardPanelHost) {
      throw new Error("Missing leaderboard panel host.");
    }
    return this.leaderboardPanelHost;
  }

  getSettingsPanelHost(): HTMLElement {
    if (!this.settingsPanelHost) {
      throw new Error("Missing settings panel host.");
    }
    return this.settingsPanelHost;
  }

  getNewsPanelHost(): HTMLElement {
    if (!this.newsPanelHost) {
      throw new Error("Missing news panel host.");
    }
    return this.newsPanelHost;
  }

  getHelpPanelHost(): HTMLElement {
    if (!this.helpPanelHost) {
      throw new Error("Missing help panel host.");
    }
    return this.helpPanelHost;
  }

  showPage(pageId: string): void {
    this.pageRouter.showPage(pageId);
  }

  setLiveTransportState(state: LiveTransportState): void {
    if (!this.connectButton || !this.disconnectButton) {
      return;
    }

    if (!this.hasLiveTransport) {
      this.connectButton.disabled = true;
      this.disconnectButton.disabled = true;
      this.connectButton.hidden = true;
      this.disconnectButton.hidden = true;
      return;
    }

    this.connectButton.hidden = false;
    this.disconnectButton.hidden = false;

    this.connectButton.disabled = state === "connecting" || state === "connected";
    this.disconnectButton.disabled =
      state === "disabled" || state === "disconnected" || state === "connecting";
  }

  dispose(): void {
    this.connectButton?.removeEventListener("click", this.handleConnectClick);
    this.disconnectButton?.removeEventListener("click", this.handleDisconnectClick);
    this.root.removeEventListener("click", this.handleNavigationClick);
    this.detachPageBinding();
    this.detachPageObserver();
  }

  private readonly handleConnectClick = (): void => {
    this.onConnectLiveTransport?.();
  };

  private readonly handleDisconnectClick = (): void => {
    this.onDisconnectLiveTransport?.();
  };

  private readonly handleNavigationClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const navItem = target?.closest<HTMLElement>(".nav-menu-item[data-page]");
    if (!navItem) {
      return;
    }
    const pageId = navItem.dataset.page;
    if (!pageId) {
      return;
    }
    this.pageRouter.showPage(pageId);
  };
}
