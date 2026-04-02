# OpenFront Full Migration Phases

This plan migrates the remaining legacy gameplay/frontend stack (now tracked in `packages/classic-runtime`) into the new Bun + Vite codebase without leaving feature gaps.

## Principles

- Preserve gameplay behavior before visual rewrites.
- Keep deterministic simulation and UI boundaries explicit.
- Ship in small phases with working builds and tests every phase.
- Track parity with measurable checks, not assumptions.

## Phase 0: Foundation and Governance

### Scope

- Stabilize environment setup and test commands.
- Add migration phase tracking and gap-report tooling.
- Establish commit policy and acceptance gates per phase.

### Exit Criteria

- `.env.example` exists at repo root and can bootstrap local `.env`.
- `npm test` and `bun run test` are aligned for this repo.
- Gap report can show old vs new implementation coverage.

## Phase 1: Gameplay Parity Core (Solo First)

### Scope

- Port singleplayer game-mode entry flow from `packages/classic-runtime`.
- Implement local game bootstrap path in new runtime.
- Reintroduce essential solo lifecycle behaviors (start, pause, end, archive).

### Exit Criteria

- Player can start and finish a SOLO game from the new app.
- Core solo flow has tests in `tests/` and passes in CI.
- No dependence on `old_project` imports.

## Phase 2: Renderer and In-Game UX Parity

### Scope

- Migrate playfield renderer path and core in-game HUD overlays.
- Port high-priority gameplay layers (events, controls, sidebars, replay hooks).
- Keep performance budget with deterministic loop boundaries.

### Phase 2A Bridge Milestone (Completed)

- Added `Classic` page in the new shell with embedded legacy gameplay UI iframe.
- Added compatibility bundling pipeline (`bun run classic:build`) to generate `public/classic/*` from `packages/classic-runtime/static/*`.
- Added cross-repo validation command (`bun run test:all`) so new-runtime and legacy-runtime tests run together when legacy source is available.
- Added fallback behavior so migrated repo remains runnable even when `packages/classic-runtime/` is not present but `public/classic` is committed.

### Exit Criteria

- New runtime has playable in-game UI parity for core actions.
- Frame budget and interaction latency are measured and documented.
- Regression tests cover migrated renderer-adjacent logic.

## Phase 3: Modal/Page Surface Parity

### Scope

- Port remaining high-impact pages/modals: lobby flows, help/troubleshooting, account, leaderboard interactions, settings parity.
- Keep modules separated by domain (`ui/pages`, `client/services`, `game/runtime`).

### Phase 3A Milestone (Completed)

- Added native `GameModeSelector` module at `src/ui/pages/GameModeSelector.ts`.
- Added native `SinglePlayerModal` module at `src/ui/pages/SinglePlayerModal.ts`.
- Added migrated local solo domain module at `src/client/solo/LocalServer.ts`.
- Wired mode hub + modal overlay into `AppUiRoot`/`createGameApp` so users can launch:
  - new runtime solo flow
  - classic UI fallback flow
  from a native Phase-3 surface.

### Exit Criteria

- Critical user journeys from old frontend are available in new frontend.
- Page/controller logic has no hidden coupling to renderer internals.

## Phase 4: Backend and Integration Completion

### Scope

- Finalize API parity paths still required by migrated frontend flows.
- Align auth/session, archive, and matchmaking control-plane behavior.

### Phase 4A Milestone (Completed)

- Switched frontend runtime boot to classic-only gameplay mode.
- Removed active usage of experimental migrated UI surfaces (Command HUD/play shell/modals) from `createGameApp`.
- App now launches directly into the classic frontend bundle and preserves URL query params into classic iframe loads.
- Kept backend + postgres integration and environment flow intact for local stack compatibility.

### Exit Criteria

- End-to-end local stack works with backend + postgres + frontend.
- Contract tests exist for migrated APIs used by UI/gameplay.

## Phase 5: Hardening, Optimization, and Cleanup

### Scope

- Remove dead migration scaffolding and duplicate legacy logic.
- Tighten types, boundaries, and performance hotspots.
- Prepare release quality checks.

### Phase 5A Milestone (Completed)

- Removed remaining active wrapper UI from the entry path.
- `src/main.ts` now routes directly to `/classic/index.html` while preserving query/hash.
- Active frontend experience is now full-screen classic OpenFront only, with no custom runtime status strips or extra shell UI.

### Exit Criteria

- All phase acceptance checks pass.
- Bundle and runtime metrics are tracked and improved.
- Codebase is organized by clear domain ownership.

## Commit and Delivery Rules

- One commit per coherent milestone within a phase.
- Commit message format: `feat(phase-X): ...`, `refactor(phase-X): ...`, `chore(phase-X): ...`.
- After each phase:
  - run tests
  - run build
  - update this file with status
  - push branch and open/update PR

## Current Status

- Phase 0: completed
- Phase 1: completed
- Phase 2: completed (classic parity bridge active)
- Phase 3: superseded by classic-only frontend mode
- Phase 4: completed (classic-only integration milestone complete)
- Phase 5: completed (full-screen classic-only entry and cleanup)
