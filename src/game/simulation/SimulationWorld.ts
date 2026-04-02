import { LEGACY_SIMULATION_RULES } from "../config/legacySimulationRules";
import type { UnitType } from "../contracts/turn";
import { isLandTerrainByte } from "../pathfinding/TerrainBits";

interface SimulationPlayerState {
  id: string;
  tiles: Set<number>;
  troops: number;
  gold: number;
  builtUnits: Record<UnitType, number>;
  donatedGold: number;
  donatedTroops: number;
  receivedGold: number;
  receivedTroops: number;
  disconnected: boolean;
  kicked: boolean;
}

export interface SimulationPlayerSnapshot {
  id: string;
  tileCount: number;
  troops: number;
  gold: number;
  builtUnitTotal: number;
  donatedGold: number;
  donatedTroops: number;
  receivedGold: number;
  receivedTroops: number;
  disconnected: boolean;
  kicked: boolean;
}

export interface SimulationWorldSummary {
  currentTurn: number;
  inSpawnPhase: boolean;
  winnerPlayerId: string | null;
  winnerDeclaredTurn: number | null;
  topTerritoryControlPercentage: number;
  activePlayerCount: number;
  eliminatedPlayerCount: number;
  ownedTileCount: number;
  unownedLandTileCount: number;
  battlesResolved: number;
  territoryTransfers: number;
  richestPlayerId: string | null;
  richestPlayerGold: number;
  topTerritoryPlayerId: string | null;
  topTerritoryTileCount: number;
}

const STARTING_TROOPS = 90_000;
const STARTING_GOLD = 60_000;
const MIN_ATTACK_TROOPS = 1_000;

const BUILD_COST: Record<UnitType, number> = {
  Transport: 7_000,
  Warship: 12_000,
  Shell: 8_000,
  SAMMissile: 9_000,
  Port: 15_000,
  "Atom Bomb": 100_000,
  "Hydrogen Bomb": 220_000,
  "Trade Ship": 10_000,
  "Missile Silo": 55_000,
  "Defense Post": 18_000,
  "SAM Launcher": 28_000,
  City: 20_000,
  MIRV: 180_000,
  "MIRV Warhead": 90_000,
  Train: 14_000,
  Factory: 45_000,
};

const EMPTY_SUMMARY: SimulationWorldSummary = {
  currentTurn: 0,
  inSpawnPhase: true,
  winnerPlayerId: null,
  winnerDeclaredTurn: null,
  topTerritoryControlPercentage: 0,
  activePlayerCount: 0,
  eliminatedPlayerCount: 0,
  ownedTileCount: 0,
  unownedLandTileCount: 0,
  battlesResolved: 0,
  territoryTransfers: 0,
  richestPlayerId: null,
  richestPlayerGold: 0,
  topTerritoryPlayerId: null,
  topTerritoryTileCount: 0,
};

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.max(minValue, Math.min(maxValue, value));
}

function calculateMaxTroopsForPlayer(player: SimulationPlayerState): number {
  const tileScore = Math.pow(Math.max(0, player.tiles.size), 0.6) * 1000 + 50_000;
  const cityBonus =
    player.builtUnits.City * LEGACY_SIMULATION_RULES.cityTroopIncreaseCap;
  return Math.max(1_000, 2 * tileScore + cityBonus);
}

function calculateTroopIncrease(player: SimulationPlayerState): number {
  const maxTroops = calculateMaxTroopsForPlayer(player);
  const currentTroops = Math.max(0, player.troops);
  const baseIncrease = 10 + Math.pow(currentTroops, 0.73) / 4;
  const ratio = clamp(1 - currentTroops / maxTroops, 0, 1);
  const nextTroops = Math.min(maxTroops, currentTroops + baseIncrease * ratio);
  return Math.max(0, Math.floor(nextTroops - currentTroops));
}

export class SimulationWorld {
  private readonly players = new Map<string, SimulationPlayerState>();
  private readonly landTiles = new Set<number>();
  private readonly tileOwner = new Map<number, string>();
  private battlesResolved = 0;
  private territoryTransfers = 0;
  private currentTurn = 0;
  private winnerPlayerId: string | null = null;
  private winnerDeclaredTurn: number | null = null;

  initializeTerrain(terrainData: Uint8Array): void {
    this.landTiles.clear();
    this.tileOwner.clear();
    this.currentTurn = 0;
    this.winnerPlayerId = null;
    this.winnerDeclaredTurn = null;

    for (const player of this.players.values()) {
      player.tiles.clear();
    }

    for (let tile = 0; tile < terrainData.length; tile += 1) {
      if (isLandTerrainByte(terrainData[tile])) {
        this.landTiles.add(tile);
      }
    }
  }

  private ensurePlayer(playerId: string): SimulationPlayerState {
    const existing = this.players.get(playerId);
    if (existing) {
      return existing;
    }

    const created: SimulationPlayerState = {
      id: playerId,
      tiles: new Set<number>(),
      troops: STARTING_TROOPS,
      gold: STARTING_GOLD,
      builtUnits: {
        Transport: 0,
        Warship: 0,
        Shell: 0,
        SAMMissile: 0,
        Port: 0,
        "Atom Bomb": 0,
        "Hydrogen Bomb": 0,
        "Trade Ship": 0,
        "Missile Silo": 0,
        "Defense Post": 0,
        "SAM Launcher": 0,
        City: 0,
        MIRV: 0,
        "MIRV Warhead": 0,
        Train: 0,
        Factory: 0,
      },
      donatedGold: 0,
      donatedTroops: 0,
      receivedGold: 0,
      receivedTroops: 0,
      disconnected: false,
      kicked: false,
    };
    this.players.set(playerId, created);
    return created;
  }

  private getUnownedLandTile(): number | null {
    for (const tile of this.landTiles) {
      if (!this.tileOwner.has(tile)) {
        return tile;
      }
    }
    return null;
  }

  private pickOwnedTile(player: SimulationPlayerState): number | null {
    for (const tile of player.tiles) {
      return tile;
    }
    return null;
  }

  spawn(playerId: string, tile: number): void {
    if (!this.landTiles.has(tile)) {
      return;
    }
    if (this.tileOwner.has(tile)) {
      return;
    }

    const player = this.ensurePlayer(playerId);
    this.tileOwner.set(tile, playerId);
    player.tiles.add(tile);
  }

  attack(attackerId: string, targetId: string | null, troops: number): void {
    const attacker = this.ensurePlayer(attackerId);
    if (attacker.tiles.size === 0) {
      return;
    }

    const committedTroops = Math.max(0, Math.floor(troops));
    if (committedTroops < MIN_ATTACK_TROOPS) {
      return;
    }

    attacker.troops = Math.max(0, attacker.troops - committedTroops);
    this.battlesResolved += 1;

    if (targetId === null || !this.players.has(targetId)) {
      const unownedTile = this.getUnownedLandTile();
      if (unownedTile !== null) {
        this.tileOwner.set(unownedTile, attackerId);
        attacker.tiles.add(unownedTile);
        this.territoryTransfers += 1;
      }
      return;
    }

    const defender = this.ensurePlayer(targetId);
    const defendingTile = this.pickOwnedTile(defender);
    if (defendingTile === null) {
      return;
    }

    const defenseStrength = Math.max(4_000, defender.troops / 8);
    if (committedTroops <= defenseStrength) {
      defender.troops = Math.max(
        0,
        defender.troops - Math.floor(committedTroops / 3),
      );
      return;
    }

    defender.tiles.delete(defendingTile);
    this.tileOwner.set(defendingTile, attackerId);
    attacker.tiles.add(defendingTile);
    defender.troops = Math.max(0, defender.troops - Math.floor(committedTroops / 2));
    this.territoryTransfers += 1;
  }

  boatAttack(attackerId: string, troops: number): void {
    // Current migration simplification: boat attacks can claim unowned coastal land.
    this.attack(attackerId, null, Math.floor(troops * 0.8));
  }

  donateGold(senderId: string, recipientId: string, amount: number): void {
    const sender = this.ensurePlayer(senderId);
    const recipient = this.ensurePlayer(recipientId);
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount === 0) {
      return;
    }

    const transfer = Math.min(sender.gold, safeAmount);
    sender.gold -= transfer;
    sender.donatedGold += transfer;
    recipient.gold += transfer;
    recipient.receivedGold += transfer;
  }

  donateTroops(senderId: string, recipientId: string, amount: number): void {
    const sender = this.ensurePlayer(senderId);
    const recipient = this.ensurePlayer(recipientId);
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount === 0) {
      return;
    }

    const transfer = Math.min(sender.troops, safeAmount);
    sender.troops -= transfer;
    sender.donatedTroops += transfer;
    recipient.troops += transfer;
    recipient.receivedTroops += transfer;
  }

  buildUnit(playerId: string, unitType: UnitType): void {
    const player = this.ensurePlayer(playerId);
    player.builtUnits[unitType] += 1;
    player.gold = Math.max(0, player.gold - BUILD_COST[unitType]);
  }

  kickPlayer(playerId: string): void {
    const player = this.ensurePlayer(playerId);
    player.kicked = true;
  }

  setDisconnected(playerId: string, disconnected: boolean): void {
    const player = this.ensurePlayer(playerId);
    player.disconnected = disconnected;
  }

  processTurn(turnNumber: number): void {
    if (!Number.isFinite(turnNumber)) {
      return;
    }

    const targetTurn = Math.max(0, Math.floor(turnNumber));
    if (targetTurn <= this.currentTurn) {
      return;
    }

    for (let turn = this.currentTurn + 1; turn <= targetTurn; turn += 1) {
      this.currentTurn = turn;
      this.applyPassiveEconomy();
      this.evaluateVictory();
    }
  }

  private applyPassiveEconomy(): void {
    for (const player of this.players.values()) {
      if (player.tiles.size === 0) {
        continue;
      }

      player.gold += LEGACY_SIMULATION_RULES.baseGoldIncomePerTick;
      player.troops += calculateTroopIncrease(player);
    }
  }

  private evaluateVictory(): void {
    if (this.winnerPlayerId !== null) {
      return;
    }
    if (this.landTiles.size === 0) {
      return;
    }
    if (this.currentTurn <= LEGACY_SIMULATION_RULES.spawnPhaseDurationTicks) {
      return;
    }

    let topPlayerId: string | null = null;
    let topTileCount = 0;
    for (const player of this.players.values()) {
      if (player.tiles.size > topTileCount) {
        topPlayerId = player.id;
        topTileCount = player.tiles.size;
      }
    }

    if (topPlayerId === null) {
      return;
    }

    const control =
      (topTileCount / Math.max(1, this.landTiles.size)) * 100;
    const elapsedSinceSpawn =
      this.currentTurn - LEGACY_SIMULATION_RULES.spawnPhaseDurationTicks;
    if (
      control > LEGACY_SIMULATION_RULES.tilesOwnedToWinPercentage ||
      elapsedSinceSpawn >= LEGACY_SIMULATION_RULES.forcedWinCheckLimitTicks
    ) {
      this.winnerPlayerId = topPlayerId;
      this.winnerDeclaredTurn = this.currentTurn;
    }
  }

  getSummary(): SimulationWorldSummary {
    if (this.players.size === 0 || this.landTiles.size === 0) {
      return {
        ...EMPTY_SUMMARY,
        currentTurn: this.currentTurn,
        inSpawnPhase:
          this.currentTurn <= LEGACY_SIMULATION_RULES.spawnPhaseDurationTicks,
        winnerPlayerId: this.winnerPlayerId,
        winnerDeclaredTurn: this.winnerDeclaredTurn,
      };
    }

    let activePlayerCount = 0;
    let eliminatedPlayerCount = 0;
    let ownedTileCount = 0;
    let richestPlayerId: string | null = null;
    let richestPlayerGold = 0;
    let topTerritoryPlayerId: string | null = null;
    let topTerritoryTileCount = 0;

    for (const player of this.players.values()) {
      const tileCount = player.tiles.size;
      if (tileCount > 0) {
        activePlayerCount += 1;
      } else {
        eliminatedPlayerCount += 1;
      }
      ownedTileCount += tileCount;

      if (player.gold > richestPlayerGold || richestPlayerId === null) {
        richestPlayerId = player.id;
        richestPlayerGold = player.gold;
      }

      if (tileCount > topTerritoryTileCount || topTerritoryPlayerId === null) {
        topTerritoryPlayerId = player.id;
        topTerritoryTileCount = tileCount;
      }
    }

    const topTerritoryControlPercentage =
      (topTerritoryTileCount / Math.max(1, this.landTiles.size)) * 100;

    return {
      currentTurn: this.currentTurn,
      inSpawnPhase:
        this.currentTurn <= LEGACY_SIMULATION_RULES.spawnPhaseDurationTicks,
      winnerPlayerId: this.winnerPlayerId,
      winnerDeclaredTurn: this.winnerDeclaredTurn,
      topTerritoryControlPercentage,
      activePlayerCount,
      eliminatedPlayerCount,
      ownedTileCount,
      unownedLandTileCount: Math.max(0, this.landTiles.size - ownedTileCount),
      battlesResolved: this.battlesResolved,
      territoryTransfers: this.territoryTransfers,
      richestPlayerId,
      richestPlayerGold,
      topTerritoryPlayerId,
      topTerritoryTileCount,
    };
  }

  getPlayerSnapshots(): SimulationPlayerSnapshot[] {
    const snapshots: SimulationPlayerSnapshot[] = [];

    for (const player of this.players.values()) {
      snapshots.push({
        id: player.id,
        tileCount: player.tiles.size,
        troops: player.troops,
        gold: player.gold,
        builtUnitTotal: Object.values(player.builtUnits).reduce(
          (sum, value) => sum + value,
          0,
        ),
        donatedGold: player.donatedGold,
        donatedTroops: player.donatedTroops,
        receivedGold: player.receivedGold,
        receivedTroops: player.receivedTroops,
        disconnected: player.disconnected,
        kicked: player.kicked,
      });
    }

    return snapshots.sort((a, b) => a.id.localeCompare(b.id));
  }
}
