export interface LegacySimulationRules {
  targetDurationTicks: number;
  targetCooldownTicks: number;
  allianceRequestDurationTicks: number;
  allianceRequestCooldownTicks: number;
  allianceDurationTicks: number;
  allianceExtensionPromptOffsetTicks: number;
}

// Values mapped from legacy DefaultConfig to preserve behavior during migration.
export const LEGACY_SIMULATION_RULES: LegacySimulationRules = {
  targetDurationTicks: 10 * 10,
  targetCooldownTicks: 15 * 10,
  allianceRequestDurationTicks: 20 * 10,
  allianceRequestCooldownTicks: 30 * 10,
  allianceDurationTicks: 300 * 10,
  allianceExtensionPromptOffsetTicks: 30 * 10,
};
