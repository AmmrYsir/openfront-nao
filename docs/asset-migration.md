# Legacy Asset Migration

Legacy game assets were copied from `packages/classic-runtime` into this project so new runtime code can consume them directly.

## Copied Paths

- `packages/classic-runtime/resources/*` -> `public/legacy/resources/*`
- `packages/classic-runtime/proprietary/*` -> `public/legacy/proprietary/*`

## Runtime Access

- Shared helpers:
  - `src/core/assets/legacyAssets.ts`
- Current worker map bootstrap reads from:
  - `/legacy/resources/maps/...`

## Snapshot

- `public/legacy/resources`: 1206 files
- `public/legacy/proprietary`: 7 files
