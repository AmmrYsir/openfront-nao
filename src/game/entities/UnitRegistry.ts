import type { UnitType } from "../contracts/turn";

export interface UnitRegistrySummary {
  activeUnitCount: number;
  deletedUnitCount: number;
  upgradedUnitCount: number;
  warshipMoveCount: number;
}

interface UnitRecord {
  id: number;
  ownerId: string;
  type: UnitType;
  tile: number;
  level: number;
  deleted: boolean;
}

function defaultTile(): number {
  return -1;
}

function defaultType(): UnitType {
  return "City";
}

export class UnitRegistry {
  private readonly unitsById = new Map<number, UnitRecord>();
  private nextUnitId = 1;
  private upgradedUnitCount = 0;
  private warshipMoveCount = 0;

  reset(): void {
    this.unitsById.clear();
    this.nextUnitId = 1;
    this.upgradedUnitCount = 0;
    this.warshipMoveCount = 0;
  }

  createUnit(ownerId: string, type: UnitType, tile: number): UnitRecord {
    const unit: UnitRecord = {
      id: this.nextUnitId,
      ownerId,
      type,
      tile,
      level: 1,
      deleted: false,
    };
    this.nextUnitId += 1;
    this.unitsById.set(unit.id, unit);
    return unit;
  }

  private ensureReferencedUnit(
    ownerId: string,
    unitId: number,
    type: UnitType,
  ): UnitRecord {
    const existing = this.unitsById.get(unitId);
    if (existing) {
      return existing;
    }

    const placeholder: UnitRecord = {
      id: unitId,
      ownerId,
      type,
      tile: defaultTile(),
      level: 1,
      deleted: false,
    };
    this.unitsById.set(unitId, placeholder);
    this.nextUnitId = Math.max(this.nextUnitId, unitId + 1);
    return placeholder;
  }

  upgradeUnit(ownerId: string, unitId: number, unitType: UnitType): void {
    const unit = this.ensureReferencedUnit(ownerId, unitId, unitType);
    if (unit.deleted) {
      unit.deleted = false;
    }
    unit.ownerId = ownerId;
    unit.type = unitType;
    unit.level += 1;
    this.upgradedUnitCount += 1;
  }

  deleteUnit(ownerId: string, unitId: number): void {
    const unit = this.ensureReferencedUnit(ownerId, unitId, defaultType());
    unit.ownerId = ownerId;
    unit.deleted = true;
  }

  moveWarship(ownerId: string, unitId: number, tile: number): void {
    const unit = this.ensureReferencedUnit(ownerId, unitId, "Warship");
    unit.ownerId = ownerId;
    unit.type = "Warship";
    unit.tile = tile;
    if (unit.deleted) {
      unit.deleted = false;
    }
    this.warshipMoveCount += 1;
  }

  getSummary(): UnitRegistrySummary {
    let activeUnitCount = 0;
    let deletedUnitCount = 0;

    for (const unit of this.unitsById.values()) {
      if (unit.deleted) {
        deletedUnitCount += 1;
      } else {
        activeUnitCount += 1;
      }
    }

    return {
      activeUnitCount,
      deletedUnitCount,
      upgradedUnitCount: this.upgradedUnitCount,
      warshipMoveCount: this.warshipMoveCount,
    };
  }
}
