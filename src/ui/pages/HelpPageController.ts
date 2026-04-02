const HELP_KEYBINDS: Array<{ action: string; key: string }> = [
  { action: "Toggle view", key: "Space" },
  { action: "Coordinate grid", key: "M" },
  { action: "Center camera", key: "C" },
  { action: "Move camera", key: "W / A / S / D" },
  { action: "Zoom", key: "Q / E" },
  { action: "Attack ratio", key: "T / Y" },
  { action: "Swap direction", key: "U" },
  { action: "Pause game", key: "P" },
  { action: "Game speed", key: "< / >" },
];

interface HelpPageControllerOptions {
  host: HTMLElement;
  onStatus?: (status: string) => void;
}

export class HelpPageController {
  private readonly host: HTMLElement;
  private readonly onStatus?: (status: string) => void;

  constructor(options: HelpPageControllerOptions) {
    this.host = options.host;
    this.onStatus = options.onStatus;
    this.render();
  }

  hydrate(): void {
    this.onStatus?.("Help guide ready.");
  }

  dispose(): void {
    // no-op
  }

  private render(): void {
    const hotkeys = HELP_KEYBINDS.map(
      (entry) => `<tr><td>${entry.action}</td><td>${entry.key}</td></tr>`,
    ).join("");

    this.host.innerHTML = `
      <section class="feature-panel feature-panel--help">
        <header class="panel-head">
          <h2>Help & Troubleshooting</h2>
          <p class="panel-subtitle">Migrated quick-reference from legacy help + troubleshooting modals.</p>
        </header>

        <table class="table-grid">
          <thead>
            <tr>
              <th>Action</th>
              <th>Key</th>
            </tr>
          </thead>
          <tbody>${hotkeys}</tbody>
        </table>

        <section class="field-group">
          <p class="panel-subtitle">Troubleshooting checklist</p>
          <ul class="list-block">
            <li>Ensure hardware acceleration is enabled in your browser.</li>
            <li>Close duplicate tabs to avoid multi-tab lock penalties.</li>
            <li>Use latest Chromium/Firefox builds for best WebGL stability.</li>
            <li>Lower effects settings if FPS drops on integrated GPUs.</li>
          </ul>
        </section>
      </section>
    `;
  }
}
