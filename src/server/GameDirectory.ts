import { createRequestId } from "../utils/id";
import { GameRoom, type GameRoomOptions } from "./GameRoom";

export interface CreateGameRoomOptions {
  gameID?: string;
  lobbyCreatedAt?: number;
}

export class GameDirectory {
  private readonly rooms = new Map<string, GameRoom>();

  createRoom(options?: CreateGameRoomOptions): GameRoom {
    const gameID = options?.gameID ?? createRequestId().replace("req_", "g_");
    const existing = this.rooms.get(gameID);
    if (existing) {
      return existing;
    }

    const roomOptions: GameRoomOptions = {
      gameID,
      lobbyCreatedAt: options?.lobbyCreatedAt ?? Date.now(),
    };
    const room = new GameRoom(roomOptions);
    this.rooms.set(gameID, room);
    return room;
  }

  getRoom(gameID: string): GameRoom | null {
    return this.rooms.get(gameID) ?? null;
  }

  removeRoom(gameID: string): boolean {
    return this.rooms.delete(gameID);
  }

  listRoomIDs(): string[] {
    return [...this.rooms.keys()].sort((a, b) => a.localeCompare(b));
  }

  size(): number {
    return this.rooms.size;
  }
}
