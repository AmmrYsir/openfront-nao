import type { GameSessionSnapshot } from "../game/state/GameSessionStore";
import { renderNumber } from "../utils/formatNumbers";

export class Hud {
  private readonly turnValue: HTMLElement;
  private readonly processedValue: HTMLElement;
  private readonly pendingValue: HTMLElement;
  private readonly intentsValue: HTMLElement;
  private readonly supportedIntentsValue: HTMLElement;
  private readonly unsupportedIntentsValue: HTMLElement;
  private readonly hashValue: HTMLElement;
  private readonly lastIntentValue: HTMLElement;
  private readonly pausedValue: HTMLElement;
  private readonly spawnCountValue: HTMLElement;
  private readonly lastSpawnTileValue: HTMLElement;
  private readonly queueTurnButton: HTMLButtonElement;
  private readonly queueTurnHandler: () => void;

  constructor(
    host: HTMLElement,
    onQueueTurnRequested: () => void,
  ) {
    host.innerHTML = `
      <main class="app-shell">
        <section class="panel">
          <h1>Openfront Migration Scaffold</h1>
          <p class="subtitle">
            Architecture-first bootstrap: fixed loop, typed turns, isolated session state.
          </p>
          <div class="controls">
            <button id="queue-turn-btn" type="button">Queue Sample Turn</button>
          </div>
          <dl class="metrics">
            <div><dt>Current Turn</dt><dd id="hud-turn-number">0</dd></div>
            <div><dt>Processed Turns</dt><dd id="hud-processed-turns">0</dd></div>
            <div><dt>Pending Turns</dt><dd id="hud-pending-turns">0</dd></div>
            <div><dt>Total Intents</dt><dd id="hud-total-intents">0</dd></div>
            <div><dt>Supported Intents</dt><dd id="hud-supported-intents">0</dd></div>
            <div><dt>Unsupported Intents</dt><dd id="hud-unsupported-intents">0</dd></div>
            <div><dt>Last Hash</dt><dd id="hud-last-hash">n/a</dd></div>
            <div><dt>Last Intent</dt><dd id="hud-last-intent">n/a</dd></div>
            <div><dt>Paused</dt><dd id="hud-paused">false</dd></div>
            <div><dt>Spawned Tiles</dt><dd id="hud-spawn-count">0</dd></div>
            <div><dt>Last Spawn Tile</dt><dd id="hud-last-spawn-tile">n/a</dd></div>
          </dl>
        </section>
      </main>
    `;

    const turnValue = host.querySelector<HTMLElement>("#hud-turn-number");
    const processedValue = host.querySelector<HTMLElement>(
      "#hud-processed-turns",
    );
    const pendingValue = host.querySelector<HTMLElement>("#hud-pending-turns");
    const intentsValue = host.querySelector<HTMLElement>("#hud-total-intents");
    const supportedIntentsValue = host.querySelector<HTMLElement>(
      "#hud-supported-intents",
    );
    const unsupportedIntentsValue = host.querySelector<HTMLElement>(
      "#hud-unsupported-intents",
    );
    const hashValue = host.querySelector<HTMLElement>("#hud-last-hash");
    const lastIntentValue = host.querySelector<HTMLElement>("#hud-last-intent");
    const pausedValue = host.querySelector<HTMLElement>("#hud-paused");
    const spawnCountValue = host.querySelector<HTMLElement>("#hud-spawn-count");
    const lastSpawnTileValue = host.querySelector<HTMLElement>(
      "#hud-last-spawn-tile",
    );
    const queueTurnButton =
      host.querySelector<HTMLButtonElement>("#queue-turn-btn");

    if (
      !turnValue ||
      !processedValue ||
      !pendingValue ||
      !intentsValue ||
      !supportedIntentsValue ||
      !unsupportedIntentsValue ||
      !hashValue ||
      !lastIntentValue ||
      !pausedValue ||
      !spawnCountValue ||
      !lastSpawnTileValue ||
      !queueTurnButton
    ) {
      throw new Error("Failed to initialize HUD.");
    }

    this.turnValue = turnValue;
    this.processedValue = processedValue;
    this.pendingValue = pendingValue;
    this.intentsValue = intentsValue;
    this.supportedIntentsValue = supportedIntentsValue;
    this.unsupportedIntentsValue = unsupportedIntentsValue;
    this.hashValue = hashValue;
    this.lastIntentValue = lastIntentValue;
    this.pausedValue = pausedValue;
    this.spawnCountValue = spawnCountValue;
    this.lastSpawnTileValue = lastSpawnTileValue;
    this.queueTurnButton = queueTurnButton;
    this.queueTurnHandler = onQueueTurnRequested;
    this.queueTurnButton.addEventListener("click", this.queueTurnHandler);
  }

  render(snapshot: GameSessionSnapshot): void {
    this.turnValue.textContent = String(snapshot.turnNumber);
    this.processedValue.textContent = renderNumber(snapshot.processedTurnCount);
    this.pendingValue.textContent = renderNumber(snapshot.pendingTurnCount);
    this.intentsValue.textContent = renderNumber(snapshot.totalIntentCount);
    this.supportedIntentsValue.textContent = renderNumber(
      snapshot.supportedIntentCount,
    );
    this.unsupportedIntentsValue.textContent = renderNumber(
      snapshot.unsupportedIntentCount,
    );
    this.hashValue.textContent =
      snapshot.lastHash === null ? "n/a" : String(snapshot.lastHash);
    this.lastIntentValue.textContent = snapshot.lastProcessedIntentType ?? "n/a";
    this.pausedValue.textContent = String(snapshot.paused);
    this.spawnCountValue.textContent = renderNumber(snapshot.spawnedTileCount);
    this.lastSpawnTileValue.textContent =
      snapshot.lastSpawnTile === null ? "n/a" : String(snapshot.lastSpawnTile);
  }

  dispose(): void {
    this.queueTurnButton.removeEventListener("click", this.queueTurnHandler);
  }
}
