import { legacyResourceUrl } from "../core/assets/legacyAssets";

export class AppUiRoot {
  private readonly root: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly classicStatusValue: HTMLElement;
  private readonly classicPanelHost: HTMLElement;

  constructor(host: HTMLElement) {
    host.style.setProperty(
      "--legacy-background-image",
      `url("${legacyResourceUrl("images/background.webp")}")`,
    );
    host.style.setProperty(
      "--legacy-desktop-logo-image",
      `url("${legacyResourceUrl("images/OpenFront.webp")}")`,
    );

    host.innerHTML = `
      <div class="legacy-ui-root classic-only-root">
        <div class="legacy-background" aria-hidden="true">
          <div class="legacy-background-layer"></div>
          <div class="legacy-background-logo legacy-background-logo--desktop"></div>
        </div>

        <div class="classic-only-shell">
          <header class="legacy-top-nav classic-only-nav">
            <div class="legacy-brand" aria-label="OpenFront logo"></div>
            <span class="meta-pill">Classic UI Mode</span>
          </header>

          <main class="classic-only-content">
            <section class="panel-status-row">
              <span class="panel-status-label">Runtime status</span>
              <span id="transport-status" class="panel-status-value">Starting classic frontend...</span>
            </section>
            <section class="panel-status-row">
              <span class="panel-status-label">Classic status</span>
              <span id="classic-status" class="panel-status-value">Idle.</span>
            </section>
            <section id="classic-panel-host"></section>
          </main>
        </div>
      </div>
    `;

    this.root = host;

    const statusValue = host.querySelector<HTMLElement>("#transport-status");
    const classicStatusValue = host.querySelector<HTMLElement>("#classic-status");
    const classicPanelHost = host.querySelector<HTMLElement>("#classic-panel-host");
    if (!statusValue || !classicStatusValue || !classicPanelHost) {
      throw new Error("Failed to initialize classic-only UI root.");
    }

    this.statusValue = statusValue;
    this.classicStatusValue = classicStatusValue;
    this.classicPanelHost = classicPanelHost;
  }

  setStatus(text: string): void {
    this.statusValue.textContent = text;
  }

  setClassicStatus(text: string): void {
    this.classicStatusValue.textContent = text;
  }

  getClassicPanelHost(): HTMLElement {
    return this.classicPanelHost;
  }

  showPage(_pageId: string): void {
    // Classic-only mode intentionally ignores page navigation.
  }

  dispose(): void {
    this.root.innerHTML = "";
  }
}
