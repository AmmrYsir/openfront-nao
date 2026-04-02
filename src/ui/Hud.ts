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
  private readonly disconnectedClientsValue: HTMLElement;
  private readonly activeEmbargoValue: HTMLElement;
  private readonly targetedPlayersValue: HTMLElement;
  private readonly combatActionsValue: HTMLElement;
  private readonly movementActionsValue: HTMLElement;
  private readonly diplomacyActionsValue: HTMLElement;
  private readonly economyActionsValue: HTMLElement;
  private readonly constructionActionsValue: HTMLElement;
  private readonly socialActionsValue: HTMLElement;
  private readonly moderationActionsValue: HTMLElement;
  private readonly configActionsValue: HTMLElement;
  private readonly donatedGoldValue: HTMLElement;
  private readonly donatedTroopsValue: HTMLElement;
  private readonly builtUnitsValue: HTMLElement;
  private readonly lastConfigPatchSizeValue: HTMLElement;
  private readonly mapIdValue: HTMLElement;
  private readonly mapSizeValue: HTMLElement;
  private readonly mapLoadedValue: HTMLElement;
  private readonly mapSourceValue: HTMLElement;
  private readonly mapDimensionsValue: HTMLElement;
  private readonly nationCountValue: HTMLElement;
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
            <div><dt>Disconnected Clients</dt><dd id="hud-disconnected-clients">0</dd></div>
            <div><dt>Active Embargos</dt><dd id="hud-active-embargos">0</dd></div>
            <div><dt>Targeted Players</dt><dd id="hud-targeted-players">0</dd></div>
            <div><dt>Combat Actions</dt><dd id="hud-actions-combat">0</dd></div>
            <div><dt>Movement Actions</dt><dd id="hud-actions-movement">0</dd></div>
            <div><dt>Diplomacy Actions</dt><dd id="hud-actions-diplomacy">0</dd></div>
            <div><dt>Economy Actions</dt><dd id="hud-actions-economy">0</dd></div>
            <div><dt>Construction Actions</dt><dd id="hud-actions-construction">0</dd></div>
            <div><dt>Social Actions</dt><dd id="hud-actions-social">0</dd></div>
            <div><dt>Moderation Actions</dt><dd id="hud-actions-moderation">0</dd></div>
            <div><dt>Config Actions</dt><dd id="hud-actions-config">0</dd></div>
            <div><dt>Donated Gold</dt><dd id="hud-donated-gold">0</dd></div>
            <div><dt>Donated Troops</dt><dd id="hud-donated-troops">0</dd></div>
            <div><dt>Built Units</dt><dd id="hud-built-units">0</dd></div>
            <div><dt>Last Config Patch</dt><dd id="hud-last-config-patch-size">0</dd></div>
            <div><dt>Map ID</dt><dd id="hud-map-id">n/a</dd></div>
            <div><dt>Map Size</dt><dd id="hud-map-size">n/a</dd></div>
            <div><dt>Map Loaded</dt><dd id="hud-map-loaded">false</dd></div>
            <div><dt>Map Source</dt><dd id="hud-map-source">n/a</dd></div>
            <div><dt>Map Dimensions</dt><dd id="hud-map-dimensions">n/a</dd></div>
            <div><dt>Nations</dt><dd id="hud-map-nations">0</dd></div>
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
    const disconnectedClientsValue = host.querySelector<HTMLElement>(
      "#hud-disconnected-clients",
    );
    const activeEmbargoValue =
      host.querySelector<HTMLElement>("#hud-active-embargos");
    const targetedPlayersValue =
      host.querySelector<HTMLElement>("#hud-targeted-players");
    const combatActionsValue =
      host.querySelector<HTMLElement>("#hud-actions-combat");
    const movementActionsValue = host.querySelector<HTMLElement>(
      "#hud-actions-movement",
    );
    const diplomacyActionsValue = host.querySelector<HTMLElement>(
      "#hud-actions-diplomacy",
    );
    const economyActionsValue =
      host.querySelector<HTMLElement>("#hud-actions-economy");
    const constructionActionsValue = host.querySelector<HTMLElement>(
      "#hud-actions-construction",
    );
    const socialActionsValue =
      host.querySelector<HTMLElement>("#hud-actions-social");
    const moderationActionsValue = host.querySelector<HTMLElement>(
      "#hud-actions-moderation",
    );
    const configActionsValue =
      host.querySelector<HTMLElement>("#hud-actions-config");
    const donatedGoldValue =
      host.querySelector<HTMLElement>("#hud-donated-gold");
    const donatedTroopsValue = host.querySelector<HTMLElement>(
      "#hud-donated-troops",
    );
    const builtUnitsValue = host.querySelector<HTMLElement>("#hud-built-units");
    const lastConfigPatchSizeValue = host.querySelector<HTMLElement>(
      "#hud-last-config-patch-size",
    );
    const mapIdValue = host.querySelector<HTMLElement>("#hud-map-id");
    const mapSizeValue = host.querySelector<HTMLElement>("#hud-map-size");
    const mapLoadedValue = host.querySelector<HTMLElement>("#hud-map-loaded");
    const mapSourceValue = host.querySelector<HTMLElement>("#hud-map-source");
    const mapDimensionsValue = host.querySelector<HTMLElement>(
      "#hud-map-dimensions",
    );
    const nationCountValue = host.querySelector<HTMLElement>("#hud-map-nations");
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
      !disconnectedClientsValue ||
      !activeEmbargoValue ||
      !targetedPlayersValue ||
      !combatActionsValue ||
      !movementActionsValue ||
      !diplomacyActionsValue ||
      !economyActionsValue ||
      !constructionActionsValue ||
      !socialActionsValue ||
      !moderationActionsValue ||
      !configActionsValue ||
      !donatedGoldValue ||
      !donatedTroopsValue ||
      !builtUnitsValue ||
      !lastConfigPatchSizeValue ||
      !mapIdValue ||
      !mapSizeValue ||
      !mapLoadedValue ||
      !mapSourceValue ||
      !mapDimensionsValue ||
      !nationCountValue ||
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
    this.disconnectedClientsValue = disconnectedClientsValue;
    this.activeEmbargoValue = activeEmbargoValue;
    this.targetedPlayersValue = targetedPlayersValue;
    this.combatActionsValue = combatActionsValue;
    this.movementActionsValue = movementActionsValue;
    this.diplomacyActionsValue = diplomacyActionsValue;
    this.economyActionsValue = economyActionsValue;
    this.constructionActionsValue = constructionActionsValue;
    this.socialActionsValue = socialActionsValue;
    this.moderationActionsValue = moderationActionsValue;
    this.configActionsValue = configActionsValue;
    this.donatedGoldValue = donatedGoldValue;
    this.donatedTroopsValue = donatedTroopsValue;
    this.builtUnitsValue = builtUnitsValue;
    this.lastConfigPatchSizeValue = lastConfigPatchSizeValue;
    this.mapIdValue = mapIdValue;
    this.mapSizeValue = mapSizeValue;
    this.mapLoadedValue = mapLoadedValue;
    this.mapSourceValue = mapSourceValue;
    this.mapDimensionsValue = mapDimensionsValue;
    this.nationCountValue = nationCountValue;
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
    this.disconnectedClientsValue.textContent = renderNumber(
      snapshot.disconnectedClientCount,
    );
    this.activeEmbargoValue.textContent = renderNumber(
      snapshot.activeEmbargoCount,
    );
    this.targetedPlayersValue.textContent = renderNumber(
      snapshot.targetedPlayerCount,
    );
    this.combatActionsValue.textContent = renderNumber(
      snapshot.actionCounters.combat,
    );
    this.movementActionsValue.textContent = renderNumber(
      snapshot.actionCounters.movement,
    );
    this.diplomacyActionsValue.textContent = renderNumber(
      snapshot.actionCounters.diplomacy,
    );
    this.economyActionsValue.textContent = renderNumber(
      snapshot.actionCounters.economy,
    );
    this.constructionActionsValue.textContent = renderNumber(
      snapshot.actionCounters.construction,
    );
    this.socialActionsValue.textContent = renderNumber(
      snapshot.actionCounters.social,
    );
    this.moderationActionsValue.textContent = renderNumber(
      snapshot.actionCounters.moderation,
    );
    this.configActionsValue.textContent = renderNumber(
      snapshot.actionCounters.configuration,
    );
    this.donatedGoldValue.textContent = renderNumber(snapshot.donatedGoldTotal);
    this.donatedTroopsValue.textContent = renderNumber(
      snapshot.donatedTroopsTotal,
    );
    this.builtUnitsValue.textContent = renderNumber(snapshot.builtUnitTotal);
    this.lastConfigPatchSizeValue.textContent = renderNumber(
      snapshot.lastConfigPatchSize,
    );
    this.mapIdValue.textContent = snapshot.mapId ?? "n/a";
    this.mapSizeValue.textContent = snapshot.mapSize ?? "n/a";
    this.mapLoadedValue.textContent = String(snapshot.mapLoaded);
    this.mapSourceValue.textContent = snapshot.mapSourcePath ?? "n/a";
    this.mapDimensionsValue.textContent =
      snapshot.mapWidth !== null &&
      snapshot.mapHeight !== null &&
      snapshot.miniMapWidth !== null &&
      snapshot.miniMapHeight !== null
        ? `${snapshot.mapWidth}x${snapshot.mapHeight} (mini ${snapshot.miniMapWidth}x${snapshot.miniMapHeight})`
        : "n/a";
    this.nationCountValue.textContent = renderNumber(snapshot.nationCount);
  }

  dispose(): void {
    this.queueTurnButton.removeEventListener("click", this.queueTurnHandler);
  }
}
