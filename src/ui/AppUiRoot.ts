interface AppUiRootOptions {
  hasLiveTransport: boolean;
  onConnectLiveTransport?: () => void;
  onDisconnectLiveTransport?: () => void;
}

type LiveTransportState = "disabled" | "disconnected" | "connecting" | "connected";

export class AppUiRoot {
  private readonly hudMount: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly connectButton: HTMLButtonElement | null;
  private readonly disconnectButton: HTMLButtonElement | null;
  private readonly hasLiveTransport: boolean;
  private readonly onConnectLiveTransport?: () => void;
  private readonly onDisconnectLiveTransport?: () => void;

  constructor(host: HTMLElement, options: AppUiRootOptions) {
    this.hasLiveTransport = options.hasLiveTransport;
    this.onConnectLiveTransport = options.onConnectLiveTransport;
    this.onDisconnectLiveTransport = options.onDisconnectLiveTransport;

    host.innerHTML = `
      <div class="ui-root">
        <section class="transport-panel">
          <div class="transport-title">Runtime Status</div>
          <div id="transport-status" class="transport-status">Booting simulation runtime...</div>
          <div class="transport-controls">
            <button id="transport-connect" type="button">Connect Live Turns</button>
            <button id="transport-disconnect" type="button">Disconnect Live Turns</button>
          </div>
        </section>
        <section id="hud-mount"></section>
      </div>
    `;

    const hudMount = host.querySelector<HTMLElement>("#hud-mount");
    const statusValue = host.querySelector<HTMLElement>("#transport-status");
    const connectButton = host.querySelector<HTMLButtonElement>("#transport-connect");
    const disconnectButton = host.querySelector<HTMLButtonElement>("#transport-disconnect");

    if (!hudMount || !statusValue) {
      throw new Error("Failed to initialize app UI root.");
    }

    this.hudMount = hudMount;
    this.statusValue = statusValue;
    this.connectButton = connectButton;
    this.disconnectButton = disconnectButton;

    this.connectButton?.addEventListener("click", this.handleConnectClick);
    this.disconnectButton?.addEventListener("click", this.handleDisconnectClick);

    this.setLiveTransportState(this.hasLiveTransport ? "disconnected" : "disabled");
  }

  getHudHost(): HTMLElement {
    return this.hudMount;
  }

  setStatus(text: string): void {
    this.statusValue.textContent = text;
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
  }

  private readonly handleConnectClick = (): void => {
    this.onConnectLiveTransport?.();
  };

  private readonly handleDisconnectClick = (): void => {
    this.onDisconnectLiveTransport?.();
  };
}
