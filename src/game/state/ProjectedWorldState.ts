import { LEGACY_SIMULATION_RULES } from "../config/legacySimulationRules";
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
  embargoTargets: Set<string>;
  isDisconnected: boolean;
  isKicked: boolean;
}

interface TargetRecord {
  targetId: string;
  createdAt: number;
  expiresAt: number;
}

interface PendingAllianceRequest {
  requestorId: string;
  recipientId: string;
  createdAt: number;
  expiresAt: number;
}

interface ActiveAlliance {
  playerA: string;
  playerB: string;
  createdAt: number;
  expiresAt: number;
  extensionAgreements: Set<string>;
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
  expiredAllianceCount: number;
  expiredAllianceRequestCount: number;
  blockedAllianceRequestCount: number;
  blockedTargetCount: number;
  allianceInExtensionWindowCount: number;
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
  expiredAllianceCount: 0,
  expiredAllianceRequestCount: 0,
  blockedAllianceRequestCount: 0,
  blockedTargetCount: 0,
  allianceInExtensionWindowCount: 0,
};

export class ProjectedWorldState {
  private readonly players = new Map<string, ProjectedPlayerState>();
  private readonly playerTargets = new Map<string, TargetRecord[]>();
  private readonly pendingAllianceRequests = new Map<
    string,
    PendingAllianceRequest
  >();
  private readonly pastAllianceRequestTicks = new Map<string, number>();
  private readonly activeAlliances = new Map<string, ActiveAlliance>();
  private readonly activeEmbargoes = new Set<string>();
  private pendingGroundAttacks = 0;
  private pendingBoatAttacks = 0;
  private currentTick = 0;
  private expiredAllianceCount = 0;
  private expiredAllianceRequestCount = 0;
  private blockedAllianceRequestCount = 0;
  private blockedTargetCount = 0;

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

  setCurrentTick(turnNumber: number): void {
    if (!Number.isFinite(turnNumber)) {
      return;
    }

    if (turnNumber > this.currentTick) {
      this.currentTick = turnNumber;
    }

    this.pruneExpiredState();
  }

  private pruneExpiredState(): void {
    this.pruneExpiredAllianceRequests();
    this.pruneExpiredAlliances();
    this.pruneExpiredTargets();
  }

  private pruneExpiredAllianceRequests(): void {
    for (const [key, request] of this.pendingAllianceRequests.entries()) {
      if (request.expiresAt > this.currentTick) {
        continue;
      }
      this.pendingAllianceRequests.delete(key);
      this.expiredAllianceRequestCount += 1;
      this.pastAllianceRequestTicks.set(
        ProjectedWorldState.directedKey(
          request.requestorId,
          request.recipientId,
        ),
        this.currentTick,
      );
    }
  }

  private pruneExpiredAlliances(): void {
    for (const [key, alliance] of this.activeAlliances.entries()) {
      if (alliance.expiresAt > this.currentTick) {
        continue;
      }
      this.activeAlliances.delete(key);
      this.expiredAllianceCount += 1;
    }
  }

  private pruneExpiredTargetsForPlayer(playerId: string): void {
    const existing = this.playerTargets.get(playerId);
    if (!existing || existing.length === 0) {
      return;
    }

    const active = existing.filter((target) => target.expiresAt > this.currentTick);
    if (active.length === 0) {
      this.playerTargets.delete(playerId);
      return;
    }

    this.playerTargets.set(playerId, active);
  }

  private pruneExpiredTargets(): void {
    for (const playerId of this.playerTargets.keys()) {
      this.pruneExpiredTargetsForPlayer(playerId);
    }
  }

  recordSpawn(playerId: string, tile: number): void {
    const player = this.ensurePlayer(playerId);
    player.spawnedTiles.add(tile);
  }

  recordAttack(
    attackerId: string,
    targetId: string | null,
    troops: number | null,
  ): void {
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
    if (requestorId === recipientId) {
      this.blockedAllianceRequestCount += 1;
      return;
    }

    this.ensurePlayer(requestorId);
    this.ensurePlayer(recipientId);
    this.pruneExpiredState();

    const pairKey = ProjectedWorldState.pairKey(requestorId, recipientId);
    if (this.activeAlliances.has(pairKey)) {
      this.blockedAllianceRequestCount += 1;
      return;
    }

    const reverseKey = ProjectedWorldState.directedKey(recipientId, requestorId);
    const matchingReverseRequest = this.pendingAllianceRequests.get(reverseKey);
    if (matchingReverseRequest) {
      this.pendingAllianceRequests.delete(reverseKey);
      this.activeAlliances.set(pairKey, {
        playerA: requestorId <= recipientId ? requestorId : recipientId,
        playerB: requestorId <= recipientId ? recipientId : requestorId,
        createdAt: this.currentTick,
        expiresAt: this.currentTick + LEGACY_SIMULATION_RULES.allianceDurationTicks,
        extensionAgreements: new Set<string>(),
      });
      this.pastAllianceRequestTicks.set(reverseKey, this.currentTick);
      this.pastAllianceRequestTicks.set(
        ProjectedWorldState.directedKey(requestorId, recipientId),
        this.currentTick,
      );
      return;
    }

    const directKey = ProjectedWorldState.directedKey(requestorId, recipientId);
    if (this.pendingAllianceRequests.has(directKey)) {
      this.blockedAllianceRequestCount += 1;
      return;
    }

    const lastRequestTick = this.pastAllianceRequestTicks.get(directKey);
    if (
      lastRequestTick !== undefined &&
      this.currentTick - lastRequestTick <
        LEGACY_SIMULATION_RULES.allianceRequestCooldownTicks
    ) {
      this.blockedAllianceRequestCount += 1;
      return;
    }

    this.pendingAllianceRequests.set(directKey, {
      requestorId,
      recipientId,
      createdAt: this.currentTick,
      expiresAt:
        this.currentTick + LEGACY_SIMULATION_RULES.allianceRequestDurationTicks,
    });
  }

  recordAllianceReject(requestorId: string, rejectorId: string): void {
    this.ensurePlayer(requestorId);
    this.ensurePlayer(rejectorId);

    const key = ProjectedWorldState.directedKey(requestorId, rejectorId);
    const removed = this.pendingAllianceRequests.delete(key);
    if (removed) {
      this.pastAllianceRequestTicks.set(key, this.currentTick);
      return;
    }
    this.blockedAllianceRequestCount += 1;
  }

  recordAllianceExtension(senderId: string, recipientId: string): void {
    const sender = this.ensurePlayer(senderId);
    this.ensurePlayer(recipientId);
    this.pruneExpiredAlliances();

    const pairKey = ProjectedWorldState.pairKey(senderId, recipientId);
    const alliance = this.activeAlliances.get(pairKey);
    if (!alliance) {
      return;
    }

    const isInExtensionWindow =
      this.currentTick + LEGACY_SIMULATION_RULES.allianceExtensionPromptOffsetTicks >=
      alliance.expiresAt;
    if (!isInExtensionWindow) {
      return;
    }

    const sizeBefore = alliance.extensionAgreements.size;
    alliance.extensionAgreements.add(senderId);
    if (alliance.extensionAgreements.size > sizeBefore) {
      sender.allianceExtensionsSent += 1;
    }

    if (alliance.extensionAgreements.size >= 2) {
      alliance.expiresAt = this.currentTick + LEGACY_SIMULATION_RULES.allianceDurationTicks;
      alliance.extensionAgreements.clear();
    }
  }

  recordBreakAlliance(playerA: string, playerB: string): void {
    this.ensurePlayer(playerA);
    this.ensurePlayer(playerB);
    this.activeAlliances.delete(ProjectedWorldState.pairKey(playerA, playerB));
  }

  recordTarget(playerId: string, targetId: string): void {
    if (playerId === targetId) {
      this.blockedTargetCount += 1;
      return;
    }

    this.ensurePlayer(playerId);
    this.ensurePlayer(targetId);
    this.pruneExpiredTargetsForPlayer(playerId);

    const existingTargets = this.playerTargets.get(playerId) ?? [];
    const hasTargetCooldown = existingTargets.some(
      (targetRecord) =>
        this.currentTick - targetRecord.createdAt <
        LEGACY_SIMULATION_RULES.targetCooldownTicks,
    );
    if (hasTargetCooldown) {
      this.blockedTargetCount += 1;
      return;
    }

    existingTargets.push({
      targetId,
      createdAt: this.currentTick,
      expiresAt: this.currentTick + LEGACY_SIMULATION_RULES.targetDurationTicks,
    });
    this.playerTargets.set(playerId, existingTargets);
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
    this.pruneExpiredState();

    if (this.players.size === 0) {
      return {
        ...EMPTY_SUMMARY,
        expiredAllianceCount: this.expiredAllianceCount,
        expiredAllianceRequestCount: this.expiredAllianceRequestCount,
        blockedAllianceRequestCount: this.blockedAllianceRequestCount,
        blockedTargetCount: this.blockedTargetCount,
      };
    }

    let targetedPlayerCount = 0;
    let kickedPlayerCount = 0;
    let disconnectedPlayerCount = 0;
    let builtUnitTotal = 0;

    for (const [playerId, player] of this.players.entries()) {
      const activeTargets = this.playerTargets.get(playerId);
      if (activeTargets) {
        targetedPlayerCount += activeTargets.length;
      }
      if (player.isKicked) kickedPlayerCount += 1;
      if (player.isDisconnected) disconnectedPlayerCount += 1;
      builtUnitTotal += Object.values(player.builtUnits).reduce(
        (sum, count) => sum + count,
        0,
      );
    }

    let allianceInExtensionWindowCount = 0;
    for (const alliance of this.activeAlliances.values()) {
      const inWindow =
        this.currentTick + LEGACY_SIMULATION_RULES.allianceExtensionPromptOffsetTicks >=
        alliance.expiresAt;
      if (inWindow) {
        allianceInExtensionWindowCount += 1;
      }
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
      expiredAllianceCount: this.expiredAllianceCount,
      expiredAllianceRequestCount: this.expiredAllianceRequestCount,
      blockedAllianceRequestCount: this.blockedAllianceRequestCount,
      blockedTargetCount: this.blockedTargetCount,
      allianceInExtensionWindowCount,
    };
  }
}
