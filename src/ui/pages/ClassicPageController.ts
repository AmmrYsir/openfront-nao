interface ClassicPageControllerOptions {
  host: HTMLElement;
  onStatus?: (status: string) => void;
}

const CLASSIC_APP_PATH = "/classic/index.html";

export class ClassicPageController {
  private readonly host: HTMLElement;
  private readonly onStatus?: (status: string) => void;
  private iframe: HTMLIFrameElement | null = null;
  private reloadButton: HTMLButtonElement | null = null;
  private openButton: HTMLButtonElement | null = null;

  constructor(options: ClassicPageControllerOptions) {
    this.host = options.host;
    this.onStatus = options.onStatus;
    this.render();
    this.bind();
  }

  async hydrate(): Promise<void> {
    this.onStatus?.("Loading classic OpenFront UI...");
    if (this.iframe) {
      this.iframe.src = CLASSIC_APP_PATH;
    }
  }

  dispose(): void {
    this.reloadButton?.removeEventListener("click", this.handleReload);
    this.openButton?.removeEventListener("click", this.handleOpen);
    this.iframe?.removeEventListener("load", this.handleLoad);
    this.iframe?.removeEventListener("error", this.handleError);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--classic">
        <header class="panel-head">
          <h2>Classic OpenFront</h2>
          <p class="panel-subtitle">
            Full legacy gameplay frontend embedded from this repository for parity while refactor phases continue.
          </p>
        </header>
        <div class="row-inline">
          <button type="button" data-classic-reload>Reload Classic UI</button>
          <button type="button" data-classic-open>Open in New Tab</button>
        </div>
        <iframe
          data-classic-iframe
          title="Classic OpenFront"
          src="about:blank"
          style="width: 100%; height: 78vh; border: 1px solid rgba(120, 145, 200, 0.45); border-radius: 12px; background: #01040b;"
        ></iframe>
      </section>
    `;
  }

  private bind(): void {
    this.iframe = this.host.querySelector<HTMLIFrameElement>("[data-classic-iframe]");
    this.reloadButton = this.host.querySelector<HTMLButtonElement>(
      "[data-classic-reload]",
    );
    this.openButton = this.host.querySelector<HTMLButtonElement>("[data-classic-open]");

    this.reloadButton?.addEventListener("click", this.handleReload);
    this.openButton?.addEventListener("click", this.handleOpen);
    this.iframe?.addEventListener("load", this.handleLoad);
    this.iframe?.addEventListener("error", this.handleError);
  }

  private readonly handleReload = (): void => {
    if (!this.iframe) {
      return;
    }
    this.onStatus?.("Reloading classic UI...");
    this.iframe.src = CLASSIC_APP_PATH;
  };

  private readonly handleOpen = (): void => {
    window.open(CLASSIC_APP_PATH, "_blank", "noopener,noreferrer");
  };

  private readonly handleLoad = (): void => {
    this.onStatus?.("Classic UI loaded.");
  };

  private readonly handleError = (): void => {
    this.onStatus?.(
      "Classic UI failed to load. Run `npm run classic:build` to regenerate the bundle.",
    );
  };
}
