# Server Migration Scaffold

This folder contains the first typed server-side migration blocks extracted from the legacy runtime:

- `GameRoom.ts`: typed room/session state handling legacy client messages and broadcasting turn payloads.
- `GameServerRuntime.ts`: deterministic turn clock that flushes queued intents into server turns.

These modules are transport-agnostic and can be wired into a Bun websocket endpoint or a Node websocket adapter.
