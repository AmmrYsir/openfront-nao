import { parseLegacyClientMessage, type LegacyClientMessage } from "../game/network/serverMessages";
import type { StampedIntent, Turn } from "../game/contracts/turn";

export interface RoomClient {
  id: string;
  username: string;
  clanTag: string | null;
  send(message: unknown): void;
}

export interface GameRoomOptions {
  gameID: string;
  lobbyCreatedAt: number;
}

export class GameRoom {
  private readonly gameID: string;
  private readonly lobbyCreatedAt: number;
  private readonly clients = new Map<string, RoomClient>();
  private readonly pendingIntents = new Map<string, StampedIntent[]>();
  private readonly turnHistory: Turn[] = [];

  constructor(options: GameRoomOptions) {
    this.gameID = options.gameID;
    this.lobbyCreatedAt = options.lobbyCreatedAt;
  }

  join(client: RoomClient): void {
    this.clients.set(client.id, client);
    if (!this.pendingIntents.has(client.id)) {
      this.pendingIntents.set(client.id, []);
    }

    client.send({
      type: "lobby_info",
      lobby: {
        gameID: this.gameID,
        serverTime: Date.now(),
        clients: [...this.clients.values()].map((entry) => ({
          clientID: entry.id,
          username: entry.username,
          clanTag: entry.clanTag,
        })),
      },
      myClientID: client.id,
    });
  }

  leave(clientID: string): void {
    this.clients.delete(clientID);
    this.pendingIntents.delete(clientID);
  }

  receive(clientID: string, rawMessage: unknown): void {
    const client = this.clients.get(clientID);
    if (!client) {
      return;
    }

    let message: LegacyClientMessage;
    try {
      message = parseLegacyClientMessage(rawMessage);
    } catch (error: unknown) {
      const text =
        error instanceof Error ? error.message : "Invalid client message payload.";
      client.send({
        type: "error",
        error: "invalid_message",
        message: text,
      });
      return;
    }

    if (message.type === "ping") {
      client.send({ type: "ping" });
      return;
    }

    if (message.type === "intent") {
      const stampedIntent: StampedIntent = {
        ...message.intent,
        clientID: clientID,
      };

      const queue = this.pendingIntents.get(clientID) ?? [];
      queue.push(stampedIntent);
      this.pendingIntents.set(clientID, queue);
      return;
    }

    if (message.type === "rejoin") {
      const startIndex = Math.max(0, message.lastTurn);
      const missingTurns = this.turnHistory.filter(
        (turn) => turn.turnNumber >= startIndex,
      );
      client.send({
        type: "start",
        turns: missingTurns,
        gameStartInfo: {
          gameID: this.gameID,
          lobbyCreatedAt: this.lobbyCreatedAt,
          players: [...this.clients.values()].map((entry) => ({
            clientID: entry.id,
            username: entry.username,
            clanTag: entry.clanTag,
          })),
          config: {},
        },
        lobbyCreatedAt: this.lobbyCreatedAt,
        myClientID: client.id,
      });
      return;
    }

    if (message.type === "join") {
      client.send({
        type: "lobby_info",
        lobby: {
          gameID: this.gameID,
          serverTime: Date.now(),
          clients: [...this.clients.values()].map((entry) => ({
            clientID: entry.id,
            username: entry.username,
            clanTag: entry.clanTag,
          })),
        },
        myClientID: client.id,
      });
      return;
    }
  }

  flushTurn(turnNumber: number): Turn {
    const intents: StampedIntent[] = [];

    for (const [clientID, queue] of this.pendingIntents.entries()) {
      intents.push(...queue);
      this.pendingIntents.set(clientID, []);
    }

    const turn: Turn = {
      turnNumber,
      intents,
      hash: null,
    };
    this.turnHistory.push(turn);

    this.broadcast({
      type: "turn",
      turn,
    });

    return turn;
  }

  getTurnHistory(): readonly Turn[] {
    return this.turnHistory;
  }

  private broadcast(message: unknown): void {
    for (const client of this.clients.values()) {
      client.send(message);
    }
  }
}
