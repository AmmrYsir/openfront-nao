export interface ActionCounters {
  combat: number;
  movement: number;
  diplomacy: number;
  economy: number;
  construction: number;
  social: number;
  moderation: number;
  configuration: number;
}

export function createActionCounters(): ActionCounters {
  return {
    combat: 0,
    movement: 0,
    diplomacy: 0,
    economy: 0,
    construction: 0,
    social: 0,
    moderation: 0,
    configuration: 0,
  };
}
