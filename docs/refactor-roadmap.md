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

- None. Core runtime migration phases are complete for the deterministic worker + server scaffolding.

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
- Added execution-time intent rule validation with legacy cooldowns:
  deterministic rejection of invalid/self-target/cooldown intents and worker snapshot diagnostics for rejected intent reasons.
- Added foundational pathfinding/spatial migration for terrain maps:
  connected-component analysis and shortest-path utilities integrated at map bootstrap, with map-topology metrics and map-aware tile validation in intent execution.
- Added server-side migration scaffold in `src/server`:
  typed room/session intent queueing + deterministic turn flush runtime compatible with legacy message shapes.
- Added automated migrated-runtime regression tests:
  `tests/intentRuleValidator.test.ts`, `tests/pathfinding.test.ts`, and `tests/serverMessages.test.ts`, wired via `bun run test`.
- Added deterministic simulation-world domain state:
  land-tile ownership, battle/territory transfer resolution, and player economy snapshots integrated into worker snapshots and HUD.
- Added turn-lifecycle parity migration in deterministic runtime:
  per-turn passive economy growth and legacy-style victory checks (post-spawn control threshold / forced time limit) integrated into worker turn processing and surfaced in snapshots/HUD.
- Added dedicated unit lifecycle state migration:
  `src/game/entities/UnitRegistry.ts` now tracks deterministic build/upgrade/delete/move flows and exposes typed unit metrics in worker snapshots/HUD.
- Added authoritative server-session progression:
  `src/server/DeterministicGameSession.ts` applies queued turns through migrated execution/store logic for server-side deterministic snapshots, and `GameServerRuntime` can now wire snapshot callbacks each tick.
- Added migrated client service foundation (non-UI):
  typed platform detection, API base resolution, JWT auth/session client, and public API client modules in `src/client/*` with regression tests.
- Added migrated lobby/matchmaking transport services (non-UI):
  typed public lobby socket + matchmaking client transport modules in `src/client/lobby` and `src/client/matchmaking`, backed by new runtime server-config helpers and parsing tests.
- Added migrated page-navigation shell:
  `src/ui/navigation/PageRouter.ts` and updated `AppUiRoot` now provide page switching compatibility (`window.showPage`, `window.currentPageId`) with decoupled navigation logic.
- Added migrated server control-plane foundation:
  room directory lifecycle, persistent-id registry, and external game-archive API client modules in `src/server/*`, each with dedicated tests.
- Integrated migrated client services into app bootstrap:
  `createGameApp` now hydrates account/leaderboard/lobby service status through typed `AuthClient`, `PublicApiClient`, and `PublicLobbySocket` flows in the new UI shell.
- Added first-party backend + PostgreSQL integration foundation:
  `src/backend` now includes env config, Postgres pool, SQL migration tooling, health server bootstrap, repository contracts, and local dockerized Postgres setup.
- Added typed backend service layer + API surface:
  Postgres repositories (`users`, `game_records`, `ranked_leaderboard`, `public_lobbies`) now back auth refresh/user profile, leaderboard, game archive/read, game-exists, lobby endpoints, and instance metadata routes.
- Migrated legacy page-flow scaffolding into modular UI controllers:
  account, lobby directory, leaderboard, and settings panels now run from `src/ui/pages/*` and are integrated by `createGameApp` through typed `src/client/*` service modules.
- Added typed local user preferences migration:
  `src/client/settings/UserPreferencesStore.ts` now centralizes username/clan/language/runtime preference persistence and validation from legacy settings behavior.
- Added PostgreSQL-backed profile/runtime preference API:
  backend now supports `/users/@me/preferences` read/write with typed validation and persisted preference rows.
- Connected settings UI to backend preference sync:
  settings now load from and save to account profile when authenticated, while preserving local-first fallback behavior.
- Migrated ranked matchmaking orchestration into modular client domain service:
  `src/client/matchmaking/RankedMatchmakingSession.ts` now composes `MatchmakingClient` with queue/status/ready polling logic, and the lobby page controller integrates queue controls without embedding transport internals.
- Migrated legacy client safety/history utilities:
  `MultiTabSessionGuard` now protects against multi-tab conflicts with explicit lifecycle wiring, and `LocalGameHistoryStore` centralizes local replay history persistence.
- Migrated help/news support surfaces into modular pages:
  the new UI shell now includes dedicated News + Help pages with migrated changelog and troubleshooting/keybind guidance, replacing modal-only legacy coupling.

### Pending

- Singleplayer gameplay flow parity is not yet migrated:
  - `GameModeSelector` + `SinglePlayerModal` surface
  - local solo bootstrap path (`LocalServer`/singleplayer archive route integration)
  - in-game renderer/layer parity for full old frontend playability
- Legacy commerce/cosmetic purchase surface (`Store`, payment checkout UI) is intentionally deferred from this core migration pass.
- Ads/InGamePromo behavior remains untouched per migration constraints.

## File-by-File Migration Order

1. Worker protocol and bridge (done)
2. Contracts and intent schema parity (done for migrated intent surface)
3. Map/terrain loading (done)
4. Core game state (`GameImpl`, `PlayerImpl`) split into entities + systems (done for deterministic scaffolding)
5. Execution engine and intent dispatch (done)
6. UI adapters (renderer + overlays) (done for runtime HUD + transport shell)
7. Network transport integration (done)
8. Cleanup, dead-code removal, and strict type hardening (done for current scope)
