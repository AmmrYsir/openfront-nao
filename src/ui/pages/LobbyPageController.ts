import type { LobbyDirectoryClient, PublicLobbyInfo } from "../../client/lobby/LobbyDirectoryClient";

interface LobbyPageControllerOptions {
  host: HTMLElement;
  lobbyDirectoryClient: LobbyDirectoryClient;
  onStatus?: (status: string) => void;
}

export class LobbyPageController {
  private readonly host: HTMLElement;
  private readonly lobbyDirectoryClient: LobbyDirectoryClient;
  private readonly onStatus?: (status: string) => void;

  private refreshButton: HTMLButtonElement | null = null;
  private createButton: HTMLButtonElement | null = null;
  private deleteButton: HTMLButtonElement | null = null;
  private gameIdInput: HTMLInputElement | null = null;
  private payloadInput: HTMLTextAreaElement | null = null;
  private rowsNode: HTMLElement | null = null;
  private realtimeCountNode: HTMLElement | null = null;

  constructor(options: LobbyPageControllerOptions) {
    this.host = options.host;
    this.lobbyDirectoryClient = options.lobbyDirectoryClient;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
  }

  async hydrate(): Promise<void> {
    await this.refresh();
  }

  setRealtimeCount(count: number): void {
    if (!this.realtimeCountNode) {
      return;
    }
    this.realtimeCountNode.textContent = `${count}`;
  }

  dispose(): void {
    this.refreshButton?.removeEventListener("click", this.handleRefresh);
    this.createButton?.removeEventListener("click", this.handleCreate);
    this.deleteButton?.removeEventListener("click", this.handleDelete);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--lobby">
        <header class="panel-head">
          <h2>Lobby Directory</h2>
          <p class="panel-subtitle">Public lobby listing + admin management endpoint adapter.</p>
        </header>

        <div class="row-inline row-inline--spread">
          <button type="button" data-lobby-refresh>Refresh List</button>
          <span class="meta-pill">Realtime visible: <strong data-lobby-realtime>0</strong></span>
        </div>

        <table class="table-grid">
          <thead>
            <tr>
              <th>Game ID</th>
              <th>Updated</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody data-lobby-rows>
            <tr><td colspan="3" class="table-empty">Loading lobbies...</td></tr>
          </tbody>
        </table>

        <section class="field-group">
          <label class="field-label" for="lobby-admin-game-id">Admin game ID</label>
          <input id="lobby-admin-game-id" data-lobby-game-id placeholder="ABC123" />
        </section>

        <section class="field-group">
          <label class="field-label" for="lobby-admin-payload">Admin payload (JSON)</label>
          <textarea id="lobby-admin-payload" data-lobby-payload rows="4" placeholder='{"map":"world","playerCount":2}'></textarea>
        </section>

        <div class="row-inline">
          <button type="button" data-lobby-create>Upsert Lobby</button>
          <button type="button" data-lobby-delete>Delete Lobby</button>
        </div>
      </section>
    `;
  }

  private bind(): void {
    this.refreshButton = this.host.querySelector<HTMLButtonElement>(
      "[data-lobby-refresh]",
    );
    this.createButton = this.host.querySelector<HTMLButtonElement>(
      "[data-lobby-create]",
    );
    this.deleteButton = this.host.querySelector<HTMLButtonElement>(
      "[data-lobby-delete]",
    );
    this.gameIdInput = this.host.querySelector<HTMLInputElement>(
      "[data-lobby-game-id]",
    );
    this.payloadInput = this.host.querySelector<HTMLTextAreaElement>(
      "[data-lobby-payload]",
    );
    this.rowsNode = this.host.querySelector<HTMLElement>("[data-lobby-rows]");
    this.realtimeCountNode = this.host.querySelector<HTMLElement>(
      "[data-lobby-realtime]",
    );

    this.refreshButton?.addEventListener("click", this.handleRefresh);
    this.createButton?.addEventListener("click", this.handleCreate);
    this.deleteButton?.addEventListener("click", this.handleDelete);
  }

  private async refresh(): Promise<void> {
    this.pushStatus("Loading public lobbies...");
    const lobbies = await this.lobbyDirectoryClient.listPublicLobbies();
    this.renderRows(lobbies);
    this.pushStatus(`Public lobbies loaded: ${lobbies.length}.`);
  }

  private renderRows(lobbies: PublicLobbyInfo[]): void {
    if (!this.rowsNode) {
      return;
    }

    if (lobbies.length === 0) {
      this.rowsNode.innerHTML =
        '<tr><td colspan="3" class="table-empty">No public lobbies found.</td></tr>';
      return;
    }

    this.rowsNode.innerHTML = lobbies
      .map((entry) => {
        const updated = new Date(entry.updatedAt).toLocaleString();
        const payload = JSON.stringify(entry.payload);
        return `
          <tr>
            <td class="table-player">${entry.gameID}</td>
            <td>${updated}</td>
            <td><code class="inline-code">${payload}</code></td>
          </tr>
        `;
      })
      .join("");
  }

  private readonly handleRefresh = (): void => {
    void this.refresh();
  };

  private readonly handleCreate = (): void => {
    void (async () => {
      const gameID = this.gameIdInput?.value.trim() ?? "";
      if (!gameID) {
        this.pushStatus("Enter a game ID before upserting a lobby.");
        return;
      }

      let payload: Record<string, unknown> = {};
      const rawPayload = this.payloadInput?.value.trim() ?? "";
      if (rawPayload.length > 0) {
        try {
          const parsed = JSON.parse(rawPayload) as unknown;
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            this.pushStatus("Payload must be a JSON object.");
            return;
          }
          payload = parsed as Record<string, unknown>;
        } catch {
          this.pushStatus("Payload JSON is invalid.");
          return;
        }
      }

      this.pushStatus(`Upserting lobby ${gameID}...`);
      const ok = await this.lobbyDirectoryClient.upsertPublicLobby(gameID, payload);
      this.pushStatus(ok ? `Lobby ${gameID} upserted.` : "Lobby upsert failed (check API key). ");
      if (ok) {
        await this.refresh();
      }
    })();
  };

  private readonly handleDelete = (): void => {
    void (async () => {
      const gameID = this.gameIdInput?.value.trim() ?? "";
      if (!gameID) {
        this.pushStatus("Enter a game ID before deleting a lobby.");
        return;
      }

      this.pushStatus(`Deleting lobby ${gameID}...`);
      const ok = await this.lobbyDirectoryClient.removePublicLobby(gameID);
      this.pushStatus(ok ? `Lobby ${gameID} deleted.` : "Lobby delete failed (check API key).");
      if (ok) {
        await this.refresh();
      }
    })();
  };

  private pushStatus(status: string): void {
    this.onStatus?.(status);
  }
}
