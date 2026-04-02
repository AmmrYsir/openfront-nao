import { bindPageRouterToDom, PageRouter } from "./navigation/PageRouter";
import { legacyResourceUrl } from "../core/assets/legacyAssets";

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

interface NavItemDefinition {
  pageId: string;
  label: string;
}

interface PagePanelDefinition {
  pageId: string;
  statusId: string;
  statusLabel: string;
  hostId: string;
}

const NAV_ITEMS: ReadonlyArray<NavItemDefinition> = [
  { pageId: "page-play", label: "Play" },
  { pageId: "page-account", label: "Account" },
  { pageId: "page-lobby", label: "Lobby" },
  { pageId: "page-leaderboard", label: "Leaderboard" },
  { pageId: "page-settings", label: "Settings" },
  { pageId: "page-news", label: "News" },
  { pageId: "page-help", label: "Help" },
];

const CONTENT_PANELS: ReadonlyArray<PagePanelDefinition> = [
  {
    pageId: "page-account",
    statusId: "account-status",
    statusLabel: "Account status",
    hostId: "account-panel-host",
  },
  {
    pageId: "page-lobby",
    statusId: "lobby-status",
    statusLabel: "Lobby status",
    hostId: "lobby-panel-host",
  },
  {
    pageId: "page-leaderboard",
    statusId: "leaderboard-status",
    statusLabel: "Leaderboard status",
    hostId: "leaderboard-panel-host",
  },
  {
    pageId: "page-settings",
    statusId: "settings-status",
    statusLabel: "Settings status",
    hostId: "settings-panel-host",
  },
  {
    pageId: "page-news",
    statusId: "news-status",
    statusLabel: "News status",
    hostId: "news-panel-host",
  },
  {
    pageId: "page-help",
    statusId: "help-status",
    statusLabel: "Help status",
    hostId: "help-panel-host",
  },
];

function renderNavButtons(className: string): string {
  return NAV_ITEMS.map((item, index) => {
    const activeClass = index === 0 ? " active" : "";
    return `<button class="${className}${activeClass}" data-page="${item.pageId}" type="button">${item.label}</button>`;
  }).join("");
}

function renderContentPanel(panel: PagePanelDefinition): string {
  return `
    <section data-page-panel="${panel.pageId}" id="${panel.pageId}" class="page-panel" hidden>
      <div class="panel-status-row">
        <span class="panel-status-label">${panel.statusLabel}</span>
        <span id="${panel.statusId}" class="panel-status-value">Idle.</span>
      </div>
      <div id="${panel.hostId}"></div>
    </section>
  `;
}

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
  private readonly mobileMenu: HTMLElement | null;
  private readonly mobileBackdrop: HTMLElement | null;
  private readonly mobileToggle: HTMLButtonElement | null;
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

    host.style.setProperty(
      "--legacy-background-image",
      `url("${legacyResourceUrl("images/background.webp")}")`,
    );
    host.style.setProperty(
      "--legacy-desktop-logo-image",
      `url("${legacyResourceUrl("images/OpenFront.webp")}")`,
    );
    host.style.setProperty(
      "--legacy-mobile-logo-image",
      `url("${legacyResourceUrl("images/OF.webp")}")`,
    );
    host.style.setProperty(
      "--legacy-map-preview-image",
      `url("${legacyResourceUrl("images/EuropeBackgroundBlurred.webp")}")`,
    );

    host.innerHTML = `
      <div class="legacy-ui-root">
        <div class="legacy-background" aria-hidden="true">
          <div class="legacy-background-layer"></div>
          <div class="legacy-background-logo legacy-background-logo--desktop"></div>
          <div class="legacy-background-logo legacy-background-logo--mobile"></div>
        </div>

        <div id="mobile-menu-backdrop" class="legacy-mobile-menu-backdrop" hidden></div>
        <aside id="legacy-mobile-menu" class="legacy-mobile-menu" hidden>
          <div class="legacy-mobile-menu-header">Menu</div>
          <nav class="legacy-mobile-nav" aria-label="Mobile Navigation">
            ${renderNavButtons("nav-menu-item legacy-mobile-nav-item")}
          </nav>
        </aside>

        <div class="legacy-shell">
          <nav class="legacy-top-nav" aria-label="Main Navigation">
            <button
              id="legacy-mobile-menu-toggle"
              class="legacy-mobile-menu-toggle"
              type="button"
              aria-label="Open menu"
              aria-expanded="false"
              aria-controls="legacy-mobile-menu"
            >
              ☰
            </button>
            <div class="legacy-brand" aria-label="OpenFront logo"></div>
            <div class="legacy-nav-links">
              ${renderNavButtons("nav-menu-item legacy-nav-item")}
            </div>
          </nav>

          <main class="legacy-main-content">
            <section data-page-panel="page-play" id="page-play" class="page-panel active">
              <section class="transport-panel">
                <div class="transport-title">Runtime Status</div>
                <div id="transport-status" class="transport-status">Booting simulation runtime...</div>
                <div class="transport-controls">
                  <button id="transport-connect" type="button">Connect Live Turns</button>
                  <button id="transport-disconnect" type="button">Disconnect Live Turns</button>
                </div>
              </section>
              <section class="legacy-playfield">
                <div class="legacy-playfield-map" aria-hidden="true"></div>
                <section id="hud-mount" class="legacy-hud-host"></section>
              </section>
            </section>
            ${CONTENT_PANELS.map((panel) => renderContentPanel(panel)).join("")}
          </main>
        </div>
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
    const mobileMenu = host.querySelector<HTMLElement>("#legacy-mobile-menu");
    const mobileBackdrop = host.querySelector<HTMLElement>("#mobile-menu-backdrop");
    const mobileToggle = host.querySelector<HTMLButtonElement>(
      "#legacy-mobile-menu-toggle",
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
    this.mobileMenu = mobileMenu;
    this.mobileBackdrop = mobileBackdrop;
    this.mobileToggle = mobileToggle;

    this.connectButton?.addEventListener("click", this.handleConnectClick);
    this.disconnectButton?.addEventListener("click", this.handleDisconnectClick);
    this.root.addEventListener("click", this.handleNavigationClick);
    this.mobileToggle?.addEventListener("click", this.handleMobileMenuToggle);
    this.mobileBackdrop?.addEventListener("click", this.handleMobileBackdropClick);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleWindowKeydown);
    }

    this.detachPageBinding = bindPageRouterToDom(this.pageRouter, host);
    this.detachPageObserver = this.pageRouter.onChange((pageId) => {
      this.closeMobileMenu();
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
    this.mobileToggle?.removeEventListener("click", this.handleMobileMenuToggle);
    this.mobileBackdrop?.removeEventListener("click", this.handleMobileBackdropClick);
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleWindowKeydown);
    }
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

  private readonly handleMobileMenuToggle = (): void => {
    if (this.mobileMenu?.hidden ?? true) {
      this.openMobileMenu();
      return;
    }
    this.closeMobileMenu();
  };

  private readonly handleMobileBackdropClick = (): void => {
    this.closeMobileMenu();
  };

  private readonly handleWindowKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") {
      return;
    }
    this.closeMobileMenu();
  };

  private openMobileMenu(): void {
    if (!this.mobileMenu || !this.mobileBackdrop || !this.mobileToggle) {
      return;
    }
    this.mobileMenu.hidden = false;
    this.mobileBackdrop.hidden = false;
    this.mobileMenu.classList.add("open");
    this.mobileBackdrop.classList.add("open");
    this.mobileToggle.setAttribute("aria-expanded", "true");
  }

  private closeMobileMenu(): void {
    if (!this.mobileMenu || !this.mobileBackdrop || !this.mobileToggle) {
      return;
    }
    this.mobileMenu.classList.remove("open");
    this.mobileBackdrop.classList.remove("open");
    this.mobileMenu.hidden = true;
    this.mobileBackdrop.hidden = true;
    this.mobileToggle.setAttribute("aria-expanded", "false");
  }
}
