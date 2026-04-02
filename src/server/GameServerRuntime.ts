import { GameRoom } from "./GameRoom";
import type { GameSessionSnapshot } from "../game/state/GameSessionStore";
import { DeterministicGameSession } from "./DeterministicGameSession";

export interface GameServerRuntimeOptions {
  room: GameRoom;
  tickIntervalMs: number;
  session?: DeterministicGameSession;
  onSnapshot?: (snapshot: GameSessionSnapshot) => void;
}

export class GameServerRuntime {
  private readonly room: GameRoom;
  private readonly tickIntervalMs: number;
  private readonly session: DeterministicGameSession | null;
  private readonly onSnapshot: ((snapshot: GameSessionSnapshot) => void) | null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private turnNumber = 1;

  constructor(options: GameServerRuntimeOptions) {
    this.room = options.room;
    this.tickIntervalMs = options.tickIntervalMs;
    this.session = options.session ?? null;
    this.onSnapshot = options.onSnapshot ?? null;
  }

  start(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = setInterval(() => {
      const turn = this.room.flushTurn(this.turnNumber);
      if (this.session !== null) {
        this.session.applyTurn(turn);
        if (this.onSnapshot !== null) {
          this.onSnapshot(this.session.snapshot());
        }
      }
      this.turnNumber += 1;
    }, this.tickIntervalMs);
  }

  stop(): void {
    if (this.timer === null) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }
}
