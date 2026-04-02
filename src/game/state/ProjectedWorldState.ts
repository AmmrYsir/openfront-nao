import type { UnitType } from "../contracts/turn";

interface ProjectedPlayerState {
  id: string;
  spawnedTiles: Set<number>;
  attacksLaunched: number;
  attacksReceived: number;
  navalAttacksLaunched: number;
  committedTroops: number;
  goldDonated: number;
  goldReceived: number;
  troopsDonated: number;
  troopsReceived: number;
  builtUnits: Record<UnitType, number>;
  upgradedStructureCount: number;
  deletedUnitCount: number;
  movedWarshipCount: number;
  allianceExtensionsSent: number;
  targets: Set<string>;
  embargoTargets: Set<string>;
  isDisconnected: boolean;
  isKicked: boolean;
}

interface WorldSummary {
  playerCount: number;
  allianceCount: number;
  pendingAllianceRequestCount: number;
  pendingAttackCount: number;
  pendingBoatAttackCount: number;
  activeEmbargoCount: number;
  targetedPlayerCount: number;
  kickedPlayerCount: number;
  disconnectedPlayerCount: number;
  builtUnitTotal: number;
}

const EMPTY_SUMMARY: WorldSummary = {
  playerCount: 0,
  allianceCount: 0,
  pendingAllianceRequestCount: 0,
  pendingAttackCount: 0,
  pendingBoatAttackCount: 0,
  activeEmbargoCount: 0,
  targetedPlayerCount: 0,
  kickedPlayerCount: 0,
  disconnectedPlayerCount: 0,
  builtUnitTotal: 0,
};

export class ProjectedWorldState {
  private readonly players = new Map<string, ProjectedPlayerState>();
  private readonly activeAlliances = new Set<string>();
  private readonly pendingAllianceRequests = new Set<string>();
  private readonly activeEmbargoes = new Set<string>();
  private pendingGroundAttacks = 0;
  private pendingBoatAttacks = 0;

  private ensurePlayer(id: string): ProjectedPlayerState {
    const existing = this.players.get(id);
    if (existing) {
      return existing;
    }

    const created: ProjectedPlayerState = {
      id,
      spawnedTiles: new Set<number>(),
      attacksLaunched: 0,
      attacksReceived: 0,
      navalAttacksLaunched: 0,
      committedTroops: 0,
      goldDonated: 0,
      goldReceived: 0,
      troopsDonated: 0,
      troopsReceived: 0,
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
      upgradedStructureCount: 0,
      deletedUnitCount: 0,
      movedWarshipCount: 0,
      allianceExtensionsSent: 0,
      targets: new Set<string>(),
      embargoTargets: new Set<string>(),
      isDisconnected: false,
      isKicked: false,
    };

    this.players.set(id, created);
    return created;
  }

  private static pairKey(a: string, b: string): string {
    return a <= b ? `${a}|${b}` : `${b}|${a}`;
  }

  private static directedKey(from: string, to: string): string {
    return `${from}->${to}`;
  }

  recordSpawn(playerId: string, tile: number): void {
    const player = this.ensurePlayer(playerId);
    player.spawnedTiles.add(tile);
  }

  recordAttack(attackerId: string, targetId: string | null, troops: number | null): void {
    const attacker = this.ensurePlayer(attackerId);
    attacker.attacksLaunched += 1;
    attacker.committedTroops += Math.max(0, troops ?? 0);
    if (targetId !== null) {
      const target = this.ensurePlayer(targetId);
      target.attacksReceived += 1;
    }
    this.pendingGroundAttacks += 1;
  }

  recordCancelAttack(): void {
    this.pendingGroundAttacks = Math.max(0, this.pendingGroundAttacks - 1);
  }

  recordBoatAttack(attackerId: string, troops: number): void {
    const attacker = this.ensurePlayer(attackerId);
    attacker.navalAttacksLaunched += 1;
    attacker.committedTroops += Math.max(0, troops);
    this.pendingBoatAttacks += 1;
  }

  recordCancelBoat(): void {
    this.pendingBoatAttacks = Math.max(0, this.pendingBoatAttacks - 1);
  }

  recordAllianceRequest(requestorId: string, recipientId: string): void {
    this.ensurePlayer(requestorId);
    this.ensurePlayer(recipientId);

    const reverseRequest = ProjectedWorldState.directedKey(
      recipientId,
      requestorId,
    );
    const thisRequest = ProjectedWorldState.directedKey(
      requestorId,
      recipientId,
    );

    if (this.pendingAllianceRequests.has(reverseRequest)) {
      this.pendingAllianceRequests.delete(reverseRequest);
      this.activeAlliances.add(
        ProjectedWorldState.pairKey(requestorId, recipientId),
      );
      return;
    }

    this.pendingAllianceRequests.add(thisRequest);
  }

  recordAllianceReject(requestorId: string, rejectorId: string): void {
    this.ensurePlayer(requestorId);
    this.ensurePlayer(rejectorId);
    this.pendingAllianceRequests.delete(
      ProjectedWorldState.directedKey(requestorId, rejectorId),
    );
  }

  recordAllianceExtension(senderId: string, recipientId: string): void {
    const sender = this.ensurePlayer(senderId);
    this.ensurePlayer(recipientId);

    const pair = ProjectedWorldState.pairKey(senderId, recipientId);
    if (this.activeAlliances.has(pair)) {
      sender.allianceExtensionsSent += 1;
    }
  }

  recordBreakAlliance(playerA: string, playerB: string): void {
    this.ensurePlayer(playerA);
    this.ensurePlayer(playerB);
    this.activeAlliances.delete(ProjectedWorldState.pairKey(playerA, playerB));
  }

  recordTarget(playerId: string, targetId: string): void {
    const player = this.ensurePlayer(playerId);
    this.ensurePlayer(targetId);
    player.targets.add(targetId);
  }

  recordEmbargo(playerId: string, targetId: string, active: boolean): void {
    const player = this.ensurePlayer(playerId);
    if (targetId !== "__all__") {
      this.ensurePlayer(targetId);
    }

    const key = ProjectedWorldState.directedKey(playerId, targetId);
    if (active) {
      player.embargoTargets.add(targetId);
      this.activeEmbargoes.add(key);
      return;
    }

    player.embargoTargets.delete(targetId);
    this.activeEmbargoes.delete(key);
  }

  recordDonation(
    senderId: string,
    recipientId: string,
    kind: "gold" | "troops",
    amount: number | null,
  ): void {
    const sender = this.ensurePlayer(senderId);
    const recipient = this.ensurePlayer(recipientId);
    const safeAmount = Math.max(0, amount ?? 0);

    if (kind === "gold") {
      sender.goldDonated += safeAmount;
      recipient.goldReceived += safeAmount;
      return;
    }

    sender.troopsDonated += safeAmount;
    recipient.troopsReceived += safeAmount;
  }

  recordBuildUnit(playerId: string, unitType: UnitType): void {
    const player = this.ensurePlayer(playerId);
    player.builtUnits[unitType] += 1;
  }

  recordUpgradeStructure(playerId: string): void {
    const player = this.ensurePlayer(playerId);
    player.upgradedStructureCount += 1;
  }

  recordDeleteUnit(playerId: string): void {
    const player = this.ensurePlayer(playerId);
    player.deletedUnitCount += 1;
  }

  recordMoveWarship(playerId: string): void {
    const player = this.ensurePlayer(playerId);
    player.movedWarshipCount += 1;
  }

  recordKickPlayer(targetId: string): void {
    const player = this.ensurePlayer(targetId);
    player.isKicked = true;
  }

  recordDisconnected(playerId: string, isDisconnected: boolean): void {
    const player = this.ensurePlayer(playerId);
    player.isDisconnected = isDisconnected;
  }

  getSummary(): WorldSummary {
    if (this.players.size === 0) {
      return EMPTY_SUMMARY;
    }

    let targetedPlayerCount = 0;
    let kickedPlayerCount = 0;
    let disconnectedPlayerCount = 0;
    let builtUnitTotal = 0;

    for (const player of this.players.values()) {
      targetedPlayerCount += player.targets.size;
      if (player.isKicked) kickedPlayerCount += 1;
      if (player.isDisconnected) disconnectedPlayerCount += 1;
      builtUnitTotal += Object.values(player.builtUnits).reduce(
        (sum, count) => sum + count,
        0,
      );
    }

    return {
      playerCount: this.players.size,
      allianceCount: this.activeAlliances.size,
      pendingAllianceRequestCount: this.pendingAllianceRequests.size,
      pendingAttackCount: this.pendingGroundAttacks,
      pendingBoatAttackCount: this.pendingBoatAttacks,
      activeEmbargoCount: this.activeEmbargoes.size,
      targetedPlayerCount,
      kickedPlayerCount,
      disconnectedPlayerCount,
      builtUnitTotal,
    };
  }
}
