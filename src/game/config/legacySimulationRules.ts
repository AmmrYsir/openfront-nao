export interface LegacySimulationRules {
  targetDurationTicks: number;
  targetCooldownTicks: number;
  emojiMessageCooldownTicks: number;
  emojiMessageDurationTicks: number;
  donateCooldownTicks: number;
  embargoAllCooldownTicks: number;
  deleteUnitCooldownTicks: number;
  allianceRequestDurationTicks: number;
  allianceRequestCooldownTicks: number;
  allianceDurationTicks: number;
  allianceExtensionPromptOffsetTicks: number;
  spawnPhaseDurationTicks: number;
  tilesOwnedToWinPercentage: number;
  forcedWinCheckLimitTicks: number;
  baseGoldIncomePerTick: number;
  cityTroopIncreaseCap: number;
}

// Values mapped from legacy DefaultConfig to preserve behavior during migration.
export const LEGACY_SIMULATION_RULES: LegacySimulationRules = {
  targetDurationTicks: 10 * 10,
  targetCooldownTicks: 15 * 10,
  emojiMessageCooldownTicks: 5 * 10,
  emojiMessageDurationTicks: 5 * 10,
  donateCooldownTicks: 10 * 10,
  embargoAllCooldownTicks: 10 * 10,
  deleteUnitCooldownTicks: 30 * 10,
  allianceRequestDurationTicks: 20 * 10,
  allianceRequestCooldownTicks: 30 * 10,
  allianceDurationTicks: 300 * 10,
  allianceExtensionPromptOffsetTicks: 30 * 10,
  spawnPhaseDurationTicks: 300,
  tilesOwnedToWinPercentage: 80,
  forcedWinCheckLimitTicks: 170 * 60 * 10,
  baseGoldIncomePerTick: 100,
  cityTroopIncreaseCap: 250_000,
};
