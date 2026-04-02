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
          <div class="placeholder-panel">Account flow migration scaffold</div>
        </section>
        <section data-page-panel="page-lobby" id="page-lobby" class="page-panel" hidden>
          <div class="placeholder-panel">Lobby flow migration scaffold</div>
        </section>
        <section data-page-panel="page-leaderboard" id="page-leaderboard" class="page-panel" hidden>
          <div class="placeholder-panel">Leaderboard flow migration scaffold</div>
        </section>
        <section data-page-panel="page-settings" id="page-settings" class="page-panel" hidden>
          <div class="placeholder-panel">Settings flow migration scaffold</div>
        </section>
      </div>
    `;

    this.root = host;

    const hudMount = host.querySelector<HTMLElement>("#hud-mount");
    const statusValue = host.querySelector<HTMLElement>("#transport-status");
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
