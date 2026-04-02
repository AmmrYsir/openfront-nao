# Openfront Refactor Roadmap

This document tracks the migration from `old_project` into the new Bun + Vite + TypeScript runtime.

## Guiding Rules

- Keep simulation state outside rendering/UI.
- Keep worker boundary explicit for deterministic tick processing.
- Migrate behavior first, then split and simplify module responsibilities.
- Keep the app runnable on every migration slice.

## Current Status

### Completed

- Legacy runtime asset migration copied into this project:
  - `public/legacy/resources/*` (maps, sprites, sounds, lang, icons, fonts, flags, metadata)
  - `public/legacy/proprietary/*` (licensed music/sounds + license)
- New bootstrap and runtime shell:
  - `src/core/app/createGameApp.ts`
  - `src/core/loop/FixedStepLoop.ts`
  - `src/ui/Hud.ts`
- Typed event bus:
  - `src/core/events/EventBus.ts`
- Asset URL/manifest resolution migrated from legacy:
  - `src/core/assets/assetUrl.ts`
- Turn contract baseline introduced from legacy intent model:
  - `src/game/contracts/turn.ts`
- Worker-driven simulation bridge:
  - `src/game/worker/messages.ts`
  - `src/game/worker/GameWorkerClient.ts`
  - `src/game/worker/GameSimulation.worker.ts`
  - worker init now loads terrain map from copied legacy assets
- Execution migration scaffold (legacy ExecutionManager switch pattern, incrementally):
  - `src/game/execution/IntentExecutionEngine.ts`
  - `src/game/execution/handlers/*` (modular intent categories)
- Session/queue state systems:
  - `src/game/state/GameSessionStore.ts`
  - `src/game/systems/TurnQueueSystem.ts`
- Utility migration:
  - `src/utils/formatNumbers.ts` (ported from legacy number rendering rules)
  - `src/utils/pseudoRandom.ts` (ported deterministic RNG utility)
- Name placement algorithm extracted from old client graphics:
  - `src/game/systems/names/NamePlacement.ts`
- Runtime protocol validation parity with legacy turn/intents:
  - `src/game/contracts/intentSchemas.ts`
- Username/clan-tag validator migration decoupled from UI layer:
  - `src/game/validation/username.ts`
- Map loading pipeline extraction:
  - `src/game/maps/GameMapLoader.ts`
  - `src/game/maps/FetchGameMapLoader.ts`
  - `src/game/maps/TerrainMapLoader.ts`
- Map bootstrap service + URL config resolver:
  - `src/game/maps/MapBootstrapService.ts`
  - `src/game/maps/MapConfigResolver.ts`
- Simulation/client ports and worker message validation:
  - `src/core/ports/SimulationClient.ts`
  - `src/game/worker/messageSchemas.ts`
- Multiplayer transport schema + adapter:
  - `src/game/network/serverMessages.ts`
  - `src/game/network/TurnTransport.ts`
  - `src/game/network/TurnTransportResolver.ts`
  - `src/game/network/WebSocketTurnTransport.ts`
- UI composition root around HUD/runtime controls:
  - `src/ui/AppUiRoot.ts`
- Legacy dependency guard:
  - `scripts/check-old-project-imports.mjs` (`bun run check:legacy-deps`)

### In Progress

- Migrate deterministic core execution from old `src/core` into new `src/game`.
- Keep protocol compatibility with legacy `Turn` / `Intent` semantics.

### Latest Progression

- Expanded from a minimal execution stub to full typed intent dispatch coverage for all current legacy intent types.
- Added projected state counters for combat, movement, diplomacy, economy, construction, social, moderation, and configuration flows.
- Upgraded debug HUD to visualize projected simulation metrics from worker snapshots.
- Added map runtime config and worker bootstrap map loading against copied legacy assets.
- Added deterministic projected world-state transitions for key gameplay domains:
  spawn, attack/boat queues, alliance request/formation/break/extension, embargo edges, donations, unit build counts, and moderation flags.
- Added legacy-timing diplomacy lifecycle in projected simulation:
  target cooldown/duration, alliance request cooldown/expiry, alliance expiry/renewal windows, and deterministic blocked/expired counters surfaced in worker snapshots.
- Added typed projected domain snapshots in worker state:
  per-player gameplay/diplomacy fields plus active alliance/request records, enabling feature work against structured state instead of aggregate counters only.
- Added transport-ready app composition:
  optional websocket turn ingestion, validated server message contracts, UI transport controls, and simulation port abstraction in `createGameApp`.

### Pending

- Remaining work is now feature migration and gameplay parity hardening, not structural scaffolding.

## File-by-File Migration Order

1. Worker protocol and bridge (done)
2. Contracts and intent schema parity (partial, in progress)
3. Map/terrain loading
4. Core game state (`GameImpl`, `PlayerImpl`) split into entities + systems
5. Execution engine and intent dispatch
6. UI adapters (renderer + overlays)
7. Network transport integration
8. Cleanup, dead-code removal, and strict type hardening
