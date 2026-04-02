import { GameRoom } from "./GameRoom";

export interface GameServerRuntimeOptions {
  room: GameRoom;
  tickIntervalMs: number;
}

export class GameServerRuntime {
  private readonly room: GameRoom;
  private readonly tickIntervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private turnNumber = 1;

  constructor(options: GameServerRuntimeOptions) {
    this.room = options.room;
    this.tickIntervalMs = options.tickIntervalMs;
  }

  start(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = setInterval(() => {
      this.room.flushTurn(this.turnNumber);
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
