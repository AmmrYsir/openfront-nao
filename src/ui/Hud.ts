import type { GameSessionSnapshot } from "../game/state/GameSessionStore";
import { renderNumber } from "../utils/formatNumbers";

function formatProjectedPlayers(snapshot: GameSessionSnapshot): string {
  if (snapshot.projectedPlayers.length === 0) {
    return "none";
  }

  return snapshot.projectedPlayers
    .map((player) => {
      return [
        player.id,
        `spawn:${player.spawnedTileCount}`,
        `atk:${player.attacksLaunched}/${player.attacksReceived}`,
        `ally:${player.activeAllianceCount}`,
        `req:${player.outgoingAllianceRequestCount}->${player.incomingAllianceRequestCount}`,
        `target:${player.activeTargetCount}`,
        `emb:${player.activeEmbargoCount}`,
        `kick:${player.isKicked ? "y" : "n"}`,
        `disc:${player.isDisconnected ? "y" : "n"}`,
      ].join(" | ");
    })
    .join("\n");
}

function formatProjectedAlliances(snapshot: GameSessionSnapshot): string {
  if (snapshot.projectedAlliances.length === 0) {
    return "none";
  }

  return snapshot.projectedAlliances
    .map((alliance) => {
      return [
        alliance.id,
        `${alliance.playerA}<->${alliance.playerB}`,
        `ttl:${alliance.ticksRemaining}`,
        `renewWindow:${alliance.isInExtensionWindow ? "y" : "n"}`,
        `agreements:${alliance.extensionAgreementCount}`,
      ].join(" | ");
    })
    .join("\n");
}

function formatPendingAllianceRequests(snapshot: GameSessionSnapshot): string {
  if (snapshot.projectedPendingAllianceRequests.length === 0) {
    return "none";
  }

  return snapshot.projectedPendingAllianceRequests
    .map((request) => {
      return [
        request.id,
        `${request.requestorId}->${request.recipientId}`,
        `ttl:${request.ticksRemaining}`,
      ].join(" | ");
    })
    .join("\n");
}

function formatSimulationPlayers(snapshot: GameSessionSnapshot): string {
  if (snapshot.simulationPlayers.length === 0) {
    return "none";
  }

  return snapshot.simulationPlayers
    .map((player) => {
      return [
        player.id,
        `tiles:${player.tileCount}`,
        `troops:${renderNumber(player.troops)}`,
        `gold:${renderNumber(player.gold)}`,
        `built:${player.builtUnitTotal}`,
        `upg:${player.upgradedUnits}`,
        `del:${player.deletedUnits}`,
        `wmv:${player.movedWarships}`,
        `kicked:${player.kicked ? "y" : "n"}`,
        `disc:${player.disconnected ? "y" : "n"}`,
      ].join(" | ");
    })
    .join("\n");
}

export class Hud {
  private readonly turnValue: HTMLElement;
  private readonly processedValue: HTMLElement;
  private readonly pendingValue: HTMLElement;
  private readonly intentsValue: HTMLElement;
  private readonly supportedIntentsValue: HTMLElement;
  private readonly unsupportedIntentsValue: HTMLElement;
  private readonly rejectedIntentsValue: HTMLElement;
  private readonly hashValue: HTMLElement;
  private readonly lastIntentValue: HTMLElement;
  private readonly lastRejectedIntentValue: HTMLElement;
  private readonly lastRejectedReasonValue: HTMLElement;
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
  private readonly landComponentsValue: HTMLElement;
  private readonly largestLandComponentValue: HTMLElement;
  private readonly waterComponentsValue: HTMLElement;
  private readonly largestWaterComponentValue: HTMLElement;
  private readonly sampleWaterPathValue: HTMLElement;
  private readonly projectedPlayerCountValue: HTMLElement;
  private readonly projectedAllianceCountValue: HTMLElement;
  private readonly pendingAllianceRequestsValue: HTMLElement;
  private readonly pendingAttackCountValue: HTMLElement;
  private readonly pendingBoatAttackCountValue: HTMLElement;
  private readonly kickedPlayerCountValue: HTMLElement;
  private readonly expiredAllianceCountValue: HTMLElement;
  private readonly expiredAllianceRequestCountValue: HTMLElement;
  private readonly blockedAllianceRequestCountValue: HTMLElement;
  private readonly blockedTargetCountValue: HTMLElement;
  private readonly allianceExtensionWindowCountValue: HTMLElement;
  private readonly simActivePlayersValue: HTMLElement;
  private readonly simEliminatedPlayersValue: HTMLElement;
  private readonly simOwnedTilesValue: HTMLElement;
  private readonly simUnownedTilesValue: HTMLElement;
  private readonly simBattlesResolvedValue: HTMLElement;
  private readonly simTerritoryTransfersValue: HTMLElement;
  private readonly simRichestPlayerValue: HTMLElement;
  private readonly simTopTerritoryPlayerValue: HTMLElement;
  private readonly simTopControlValue: HTMLElement;
  private readonly simTurnValue: HTMLElement;
  private readonly simPhaseValue: HTMLElement;
  private readonly simWinnerValue: HTMLElement;
  private readonly simActiveUnitsValue: HTMLElement;
  private readonly simDeletedUnitsValue: HTMLElement;
  private readonly simUpgradedUnitsValue: HTMLElement;
  private readonly simWarshipMovesValue: HTMLElement;
  private readonly projectedPlayersView: HTMLElement;
  private readonly projectedAlliancesView: HTMLElement;
  private readonly projectedPendingRequestsView: HTMLElement;
  private readonly simulationPlayersView: HTMLElement;
  private readonly rejectedReasonCountsView: HTMLElement;
  private readonly queueTurnButton: HTMLButtonElement;
  private readonly queueTurnHandler: () => void;

  constructor(
    host: HTMLElement,
    onQueueTurnRequested: () => void,
  ) {
    host.innerHTML = `
      <main class="app-shell">
        <section class="panel">
          <h1>OpenFront Command HUD</h1>
          <p class="subtitle">
            Legacy UI shell running on the new deterministic Bun + Vite runtime.
          </p>
          <div class="controls">
            <button id="queue-turn-btn" type="button">Queue Local Turn</button>
          </div>
          <dl class="metrics">
            <div><dt>Current Turn</dt><dd id="hud-turn-number">0</dd></div>
            <div><dt>Processed Turns</dt><dd id="hud-processed-turns">0</dd></div>
            <div><dt>Pending Turns</dt><dd id="hud-pending-turns">0</dd></div>
            <div><dt>Total Intents</dt><dd id="hud-total-intents">0</dd></div>
            <div><dt>Supported Intents</dt><dd id="hud-supported-intents">0</dd></div>
            <div><dt>Unsupported Intents</dt><dd id="hud-unsupported-intents">0</dd></div>
            <div><dt>Rejected Intents</dt><dd id="hud-rejected-intents">0</dd></div>
            <div><dt>Last Hash</dt><dd id="hud-last-hash">n/a</dd></div>
            <div><dt>Last Intent</dt><dd id="hud-last-intent">n/a</dd></div>
            <div><dt>Last Rejected Intent</dt><dd id="hud-last-rejected-intent">n/a</dd></div>
            <div><dt>Last Reject Reason</dt><dd id="hud-last-rejected-reason">n/a</dd></div>
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
            <div><dt>Land Components</dt><dd id="hud-map-land-components">0</dd></div>
            <div><dt>Largest Land Component</dt><dd id="hud-map-largest-land-component">0</dd></div>
            <div><dt>Water Components</dt><dd id="hud-map-water-components">0</dd></div>
            <div><dt>Largest Water Component</dt><dd id="hud-map-largest-water-component">0</dd></div>
            <div><dt>Sample Water Route</dt><dd id="hud-map-water-path">n/a</dd></div>
            <div><dt>Projected Players</dt><dd id="hud-projected-players">0</dd></div>
            <div><dt>Projected Alliances</dt><dd id="hud-projected-alliances">0</dd></div>
            <div><dt>Pending Alliance Requests</dt><dd id="hud-projected-alliance-requests">0</dd></div>
            <div><dt>Pending Ground Attacks</dt><dd id="hud-projected-attacks">0</dd></div>
            <div><dt>Pending Boat Attacks</dt><dd id="hud-projected-boat-attacks">0</dd></div>
            <div><dt>Kicked Players</dt><dd id="hud-projected-kicked">0</dd></div>
            <div><dt>Expired Alliances</dt><dd id="hud-projected-expired-alliances">0</dd></div>
            <div><dt>Expired Alliance Requests</dt><dd id="hud-projected-expired-alliance-requests">0</dd></div>
            <div><dt>Blocked Alliance Requests</dt><dd id="hud-projected-blocked-alliance-requests">0</dd></div>
            <div><dt>Blocked Target Intents</dt><dd id="hud-projected-blocked-targets">0</dd></div>
            <div><dt>Alliances Near Expiry</dt><dd id="hud-projected-alliance-extension-window">0</dd></div>
            <div><dt>Sim Active Players</dt><dd id="hud-sim-active-players">0</dd></div>
            <div><dt>Sim Eliminated Players</dt><dd id="hud-sim-eliminated-players">0</dd></div>
            <div><dt>Sim Owned Tiles</dt><dd id="hud-sim-owned-tiles">0</dd></div>
            <div><dt>Sim Unowned Land</dt><dd id="hud-sim-unowned-tiles">0</dd></div>
            <div><dt>Sim Battles Resolved</dt><dd id="hud-sim-battles-resolved">0</dd></div>
            <div><dt>Sim Territory Transfers</dt><dd id="hud-sim-territory-transfers">0</dd></div>
            <div><dt>Sim Richest Player</dt><dd id="hud-sim-richest-player">n/a</dd></div>
            <div><dt>Sim Top Territory</dt><dd id="hud-sim-top-territory-player">n/a</dd></div>
            <div><dt>Sim Top Control</dt><dd id="hud-sim-top-control">0%</dd></div>
            <div><dt>Sim Turn</dt><dd id="hud-sim-turn">0</dd></div>
            <div><dt>Sim Phase</dt><dd id="hud-sim-phase">spawn</dd></div>
            <div><dt>Sim Winner</dt><dd id="hud-sim-winner">n/a</dd></div>
            <div><dt>Sim Active Units</dt><dd id="hud-sim-active-units">0</dd></div>
            <div><dt>Sim Deleted Units</dt><dd id="hud-sim-deleted-units">0</dd></div>
            <div><dt>Sim Upgraded Units</dt><dd id="hud-sim-upgraded-units">0</dd></div>
            <div><dt>Sim Warship Moves</dt><dd id="hud-sim-warship-moves">0</dd></div>
          </dl>
          <h2>Projected Players</h2>
          <pre id="hud-projected-players-view" class="hud-projection"></pre>
          <h2>Projected Alliances</h2>
          <pre id="hud-projected-alliances-view" class="hud-projection"></pre>
          <h2>Pending Alliance Requests</h2>
          <pre id="hud-projected-requests-view" class="hud-projection"></pre>
          <h2>Simulation Players</h2>
          <pre id="hud-simulation-players-view" class="hud-projection"></pre>
          <h2>Rejected Intent Reasons</h2>
          <pre id="hud-rejected-reasons-view" class="hud-projection"></pre>
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
    const rejectedIntentsValue =
      host.querySelector<HTMLElement>("#hud-rejected-intents");
    const hashValue = host.querySelector<HTMLElement>("#hud-last-hash");
    const lastIntentValue = host.querySelector<HTMLElement>("#hud-last-intent");
    const lastRejectedIntentValue = host.querySelector<HTMLElement>(
      "#hud-last-rejected-intent",
    );
    const lastRejectedReasonValue = host.querySelector<HTMLElement>(
      "#hud-last-rejected-reason",
    );
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
    const landComponentsValue = host.querySelector<HTMLElement>(
      "#hud-map-land-components",
    );
    const largestLandComponentValue = host.querySelector<HTMLElement>(
      "#hud-map-largest-land-component",
    );
    const waterComponentsValue = host.querySelector<HTMLElement>(
      "#hud-map-water-components",
    );
    const largestWaterComponentValue = host.querySelector<HTMLElement>(
      "#hud-map-largest-water-component",
    );
    const sampleWaterPathValue =
      host.querySelector<HTMLElement>("#hud-map-water-path");
    const projectedPlayerCountValue =
      host.querySelector<HTMLElement>("#hud-projected-players");
    const projectedAllianceCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-alliances",
    );
    const pendingAllianceRequestsValue = host.querySelector<HTMLElement>(
      "#hud-projected-alliance-requests",
    );
    const pendingAttackCountValue =
      host.querySelector<HTMLElement>("#hud-projected-attacks");
    const pendingBoatAttackCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-boat-attacks",
    );
    const kickedPlayerCountValue =
      host.querySelector<HTMLElement>("#hud-projected-kicked");
    const expiredAllianceCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-expired-alliances",
    );
    const expiredAllianceRequestCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-expired-alliance-requests",
    );
    const blockedAllianceRequestCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-blocked-alliance-requests",
    );
    const blockedTargetCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-blocked-targets",
    );
    const allianceExtensionWindowCountValue = host.querySelector<HTMLElement>(
      "#hud-projected-alliance-extension-window",
    );
    const simActivePlayersValue = host.querySelector<HTMLElement>(
      "#hud-sim-active-players",
    );
    const simEliminatedPlayersValue = host.querySelector<HTMLElement>(
      "#hud-sim-eliminated-players",
    );
    const simOwnedTilesValue =
      host.querySelector<HTMLElement>("#hud-sim-owned-tiles");
    const simUnownedTilesValue = host.querySelector<HTMLElement>(
      "#hud-sim-unowned-tiles",
    );
    const simBattlesResolvedValue = host.querySelector<HTMLElement>(
      "#hud-sim-battles-resolved",
    );
    const simTerritoryTransfersValue = host.querySelector<HTMLElement>(
      "#hud-sim-territory-transfers",
    );
    const simRichestPlayerValue = host.querySelector<HTMLElement>(
      "#hud-sim-richest-player",
    );
    const simTopTerritoryPlayerValue = host.querySelector<HTMLElement>(
      "#hud-sim-top-territory-player",
    );
    const simTopControlValue =
      host.querySelector<HTMLElement>("#hud-sim-top-control");
    const simTurnValue = host.querySelector<HTMLElement>("#hud-sim-turn");
    const simPhaseValue = host.querySelector<HTMLElement>("#hud-sim-phase");
    const simWinnerValue = host.querySelector<HTMLElement>("#hud-sim-winner");
    const simActiveUnitsValue = host.querySelector<HTMLElement>(
      "#hud-sim-active-units",
    );
    const simDeletedUnitsValue = host.querySelector<HTMLElement>(
      "#hud-sim-deleted-units",
    );
    const simUpgradedUnitsValue = host.querySelector<HTMLElement>(
      "#hud-sim-upgraded-units",
    );
    const simWarshipMovesValue = host.querySelector<HTMLElement>(
      "#hud-sim-warship-moves",
    );
    const projectedPlayersView = host.querySelector<HTMLElement>(
      "#hud-projected-players-view",
    );
    const projectedAlliancesView = host.querySelector<HTMLElement>(
      "#hud-projected-alliances-view",
    );
    const projectedPendingRequestsView = host.querySelector<HTMLElement>(
      "#hud-projected-requests-view",
    );
    const simulationPlayersView = host.querySelector<HTMLElement>(
      "#hud-simulation-players-view",
    );
    const rejectedReasonCountsView = host.querySelector<HTMLElement>(
      "#hud-rejected-reasons-view",
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
      !rejectedIntentsValue ||
      !hashValue ||
      !lastIntentValue ||
      !lastRejectedIntentValue ||
      !lastRejectedReasonValue ||
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
      !landComponentsValue ||
      !largestLandComponentValue ||
      !waterComponentsValue ||
      !largestWaterComponentValue ||
      !sampleWaterPathValue ||
      !projectedPlayerCountValue ||
      !projectedAllianceCountValue ||
      !pendingAllianceRequestsValue ||
      !pendingAttackCountValue ||
      !pendingBoatAttackCountValue ||
      !kickedPlayerCountValue ||
      !expiredAllianceCountValue ||
      !expiredAllianceRequestCountValue ||
      !blockedAllianceRequestCountValue ||
      !blockedTargetCountValue ||
      !allianceExtensionWindowCountValue ||
      !simActivePlayersValue ||
      !simEliminatedPlayersValue ||
      !simOwnedTilesValue ||
      !simUnownedTilesValue ||
      !simBattlesResolvedValue ||
      !simTerritoryTransfersValue ||
      !simRichestPlayerValue ||
      !simTopTerritoryPlayerValue ||
      !simTopControlValue ||
      !simTurnValue ||
      !simPhaseValue ||
      !simWinnerValue ||
      !simActiveUnitsValue ||
      !simDeletedUnitsValue ||
      !simUpgradedUnitsValue ||
      !simWarshipMovesValue ||
      !projectedPlayersView ||
      !projectedAlliancesView ||
      !projectedPendingRequestsView ||
      !simulationPlayersView ||
      !rejectedReasonCountsView ||
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
    this.rejectedIntentsValue = rejectedIntentsValue;
    this.hashValue = hashValue;
    this.lastIntentValue = lastIntentValue;
    this.lastRejectedIntentValue = lastRejectedIntentValue;
    this.lastRejectedReasonValue = lastRejectedReasonValue;
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
    this.landComponentsValue = landComponentsValue;
    this.largestLandComponentValue = largestLandComponentValue;
    this.waterComponentsValue = waterComponentsValue;
    this.largestWaterComponentValue = largestWaterComponentValue;
    this.sampleWaterPathValue = sampleWaterPathValue;
    this.projectedPlayerCountValue = projectedPlayerCountValue;
    this.projectedAllianceCountValue = projectedAllianceCountValue;
    this.pendingAllianceRequestsValue = pendingAllianceRequestsValue;
    this.pendingAttackCountValue = pendingAttackCountValue;
    this.pendingBoatAttackCountValue = pendingBoatAttackCountValue;
    this.kickedPlayerCountValue = kickedPlayerCountValue;
    this.expiredAllianceCountValue = expiredAllianceCountValue;
    this.expiredAllianceRequestCountValue = expiredAllianceRequestCountValue;
    this.blockedAllianceRequestCountValue = blockedAllianceRequestCountValue;
    this.blockedTargetCountValue = blockedTargetCountValue;
    this.allianceExtensionWindowCountValue = allianceExtensionWindowCountValue;
    this.simActivePlayersValue = simActivePlayersValue;
    this.simEliminatedPlayersValue = simEliminatedPlayersValue;
    this.simOwnedTilesValue = simOwnedTilesValue;
    this.simUnownedTilesValue = simUnownedTilesValue;
    this.simBattlesResolvedValue = simBattlesResolvedValue;
    this.simTerritoryTransfersValue = simTerritoryTransfersValue;
    this.simRichestPlayerValue = simRichestPlayerValue;
    this.simTopTerritoryPlayerValue = simTopTerritoryPlayerValue;
    this.simTopControlValue = simTopControlValue;
    this.simTurnValue = simTurnValue;
    this.simPhaseValue = simPhaseValue;
    this.simWinnerValue = simWinnerValue;
    this.simActiveUnitsValue = simActiveUnitsValue;
    this.simDeletedUnitsValue = simDeletedUnitsValue;
    this.simUpgradedUnitsValue = simUpgradedUnitsValue;
    this.simWarshipMovesValue = simWarshipMovesValue;
    this.projectedPlayersView = projectedPlayersView;
    this.projectedAlliancesView = projectedAlliancesView;
    this.projectedPendingRequestsView = projectedPendingRequestsView;
    this.simulationPlayersView = simulationPlayersView;
    this.rejectedReasonCountsView = rejectedReasonCountsView;
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
    this.rejectedIntentsValue.textContent = renderNumber(
      snapshot.rejectedIntentCount,
    );
    this.hashValue.textContent =
      snapshot.lastHash === null ? "n/a" : String(snapshot.lastHash);
    this.lastIntentValue.textContent = snapshot.lastProcessedIntentType ?? "n/a";
    this.lastRejectedIntentValue.textContent =
      snapshot.lastRejectedIntentType ?? "n/a";
    this.lastRejectedReasonValue.textContent =
      snapshot.lastRejectedIntentReason ?? "n/a";
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
    this.landComponentsValue.textContent = renderNumber(
      snapshot.landComponentCount,
    );
    this.largestLandComponentValue.textContent = renderNumber(
      snapshot.largestLandComponentSize,
    );
    this.waterComponentsValue.textContent = renderNumber(
      snapshot.waterComponentCount,
    );
    this.largestWaterComponentValue.textContent = renderNumber(
      snapshot.largestWaterComponentSize,
    );
    this.sampleWaterPathValue.textContent =
      snapshot.sampleWaterPathLength === null
        ? "n/a"
        : renderNumber(snapshot.sampleWaterPathLength);
    this.projectedPlayerCountValue.textContent = renderNumber(
      snapshot.projectedPlayerCount,
    );
    this.projectedAllianceCountValue.textContent = renderNumber(
      snapshot.projectedAllianceCount,
    );
    this.pendingAllianceRequestsValue.textContent = renderNumber(
      snapshot.pendingAllianceRequestCount,
    );
    this.pendingAttackCountValue.textContent = renderNumber(
      snapshot.pendingAttackCount,
    );
    this.pendingBoatAttackCountValue.textContent = renderNumber(
      snapshot.pendingBoatAttackCount,
    );
    this.kickedPlayerCountValue.textContent = renderNumber(
      snapshot.kickedPlayerCount,
    );
    this.expiredAllianceCountValue.textContent = renderNumber(
      snapshot.expiredAllianceCount,
    );
    this.expiredAllianceRequestCountValue.textContent = renderNumber(
      snapshot.expiredAllianceRequestCount,
    );
    this.blockedAllianceRequestCountValue.textContent = renderNumber(
      snapshot.blockedAllianceRequestCount,
    );
    this.blockedTargetCountValue.textContent = renderNumber(
      snapshot.blockedTargetCount,
    );
    this.allianceExtensionWindowCountValue.textContent = renderNumber(
      snapshot.allianceInExtensionWindowCount,
    );
    this.simActivePlayersValue.textContent = renderNumber(
      snapshot.simulationActivePlayerCount,
    );
    this.simEliminatedPlayersValue.textContent = renderNumber(
      snapshot.simulationEliminatedPlayerCount,
    );
    this.simOwnedTilesValue.textContent = renderNumber(
      snapshot.simulationOwnedTileCount,
    );
    this.simUnownedTilesValue.textContent = renderNumber(
      snapshot.simulationUnownedLandTileCount,
    );
    this.simBattlesResolvedValue.textContent = renderNumber(
      snapshot.simulationBattlesResolved,
    );
    this.simTerritoryTransfersValue.textContent = renderNumber(
      snapshot.simulationTerritoryTransfers,
    );
    this.simRichestPlayerValue.textContent =
      snapshot.simulationRichestPlayerId === null
        ? "n/a"
        : `${snapshot.simulationRichestPlayerId} (${renderNumber(snapshot.simulationRichestPlayerGold)}g)`;
    this.simTopTerritoryPlayerValue.textContent =
      snapshot.simulationTopTerritoryPlayerId === null
        ? "n/a"
        : `${snapshot.simulationTopTerritoryPlayerId} (${renderNumber(snapshot.simulationTopTerritoryTileCount)} tiles)`;
    this.simTopControlValue.textContent =
      `${snapshot.simulationTopTerritoryControlPercentage.toFixed(2)}%`;
    this.simTurnValue.textContent = renderNumber(snapshot.simulationCurrentTurn);
    this.simPhaseValue.textContent = snapshot.simulationInSpawnPhase
      ? "spawn"
      : "battle";
    this.simWinnerValue.textContent =
      snapshot.simulationWinnerPlayerId === null
        ? "n/a"
        : `${snapshot.simulationWinnerPlayerId} @ turn ${renderNumber(snapshot.simulationWinnerDeclaredTurn ?? 0)}`;
    this.simActiveUnitsValue.textContent = renderNumber(
      snapshot.simulationActiveUnitCount,
    );
    this.simDeletedUnitsValue.textContent = renderNumber(
      snapshot.simulationDeletedUnitCount,
    );
    this.simUpgradedUnitsValue.textContent = renderNumber(
      snapshot.simulationUpgradedUnitCount,
    );
    this.simWarshipMovesValue.textContent = renderNumber(
      snapshot.simulationWarshipMoveCount,
    );
    this.projectedPlayersView.textContent = formatProjectedPlayers(snapshot);
    this.projectedAlliancesView.textContent = formatProjectedAlliances(snapshot);
    this.projectedPendingRequestsView.textContent =
      formatPendingAllianceRequests(snapshot);
    this.simulationPlayersView.textContent = formatSimulationPlayers(snapshot);
    this.rejectedReasonCountsView.textContent =
      Object.keys(snapshot.rejectedIntentReasonCounts).length === 0
        ? "none"
        : Object.entries(snapshot.rejectedIntentReasonCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([reason, count]) => `${reason}: ${count}`)
            .join("\n");
  }

  dispose(): void {
    this.queueTurnButton.removeEventListener("click", this.queueTurnHandler);
  }
}
