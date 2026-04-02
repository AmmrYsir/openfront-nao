import type {
  PublicApiClient,
  RankedLeaderboardResponse,
} from "../../client/api/PublicApiClient";

interface LeaderboardPageControllerOptions {
  host: HTMLElement;
  apiClient: PublicApiClient;
  onStatus?: (status: string) => void;
}

export class LeaderboardPageController {
  private readonly host: HTMLElement;
  private readonly apiClient: PublicApiClient;
  private readonly onStatus?: (status: string) => void;

  private page = 1;
  private refreshButton: HTMLButtonElement | null = null;
  private previousButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;
  private pageValueNode: HTMLElement | null = null;
  private rowsNode: HTMLElement | null = null;

  constructor(options: LeaderboardPageControllerOptions) {
    this.host = options.host;
    this.apiClient = options.apiClient;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
  }

  async hydrate(): Promise<void> {
    await this.loadPage(this.page);
  }

  dispose(): void {
    this.refreshButton?.removeEventListener("click", this.handleRefresh);
    this.previousButton?.removeEventListener("click", this.handlePrevious);
    this.nextButton?.removeEventListener("click", this.handleNext);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--leaderboard">
        <header class="panel-head">
          <h2>Leaderboard</h2>
          <p class="panel-subtitle">Ranked player standings backed by the backend service.</p>
        </header>

        <div class="row-inline row-inline--spread">
          <div class="row-inline">
            <button type="button" data-leaderboard-prev>Previous</button>
            <button type="button" data-leaderboard-next>Next</button>
            <button type="button" data-leaderboard-refresh>Refresh</button>
          </div>
          <span class="meta-pill" data-leaderboard-page>Page 1</span>
        </div>

        <table class="table-grid">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Elo</th>
              <th>W</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody data-leaderboard-rows>
            <tr><td colspan="5" class="table-empty">Loading leaderboard...</td></tr>
          </tbody>
        </table>
      </section>
    `;
  }

  private bind(): void {
    this.refreshButton = this.host.querySelector<HTMLButtonElement>(
      "[data-leaderboard-refresh]",
    );
    this.previousButton = this.host.querySelector<HTMLButtonElement>(
      "[data-leaderboard-prev]",
    );
    this.nextButton = this.host.querySelector<HTMLButtonElement>(
      "[data-leaderboard-next]",
    );
    this.pageValueNode = this.host.querySelector<HTMLElement>(
      "[data-leaderboard-page]",
    );
    this.rowsNode = this.host.querySelector<HTMLElement>(
      "[data-leaderboard-rows]",
    );

    this.refreshButton?.addEventListener("click", this.handleRefresh);
    this.previousButton?.addEventListener("click", this.handlePrevious);
    this.nextButton?.addEventListener("click", this.handleNext);
  }

  private async loadPage(page: number): Promise<void> {
    const safePage = Math.max(1, page);
    this.page = safePage;
    this.pushStatus(`Loading leaderboard page ${safePage}...`);

    const response = await this.apiClient.fetchPlayerLeaderboard(safePage);
    if (response === false) {
      this.renderEmpty("Leaderboard unavailable.");
      this.pushStatus("Leaderboard unavailable.");
      return;
    }
    if (response === "reached_limit") {
      this.renderEmpty("Reached leaderboard page limit.");
      this.pushStatus("Leaderboard page limit reached.");
      return;
    }

    this.renderRows(response);
    this.pushStatus(`Top ranked players loaded: ${response.players.length}.`);
  }

  private renderRows(response: RankedLeaderboardResponse): void {
    if (!this.rowsNode) {
      return;
    }

    this.page = response.page;
    if (this.pageValueNode) {
      this.pageValueNode.textContent = `Page ${response.page} / ${response.pageCount}`;
    }

    if (response.players.length === 0) {
      this.renderEmpty("No ranked players yet.");
      return;
    }

    this.rowsNode.innerHTML = response.players
      .map((player, index) => {
        const rank = (response.page - 1) * response.players.length + index + 1;
        const wins =
          typeof player.wins === "number" ? String(player.wins) : "-";
        const losses =
          typeof player.losses === "number" ? String(player.losses) : "-";
        return `
          <tr>
            <td>${rank}</td>
            <td class="table-player">${player.playerID}</td>
            <td>${player.elo}</td>
            <td>${wins}</td>
            <td>${losses}</td>
          </tr>
        `;
      })
      .join("");
  }

  private renderEmpty(message: string): void {
    if (!this.rowsNode) {
      return;
    }
    this.rowsNode.innerHTML = `<tr><td colspan="5" class="table-empty">${message}</td></tr>`;
  }

  private readonly handleRefresh = (): void => {
    void this.loadPage(this.page);
  };

  private readonly handlePrevious = (): void => {
    void this.loadPage(Math.max(1, this.page - 1));
  };

  private readonly handleNext = (): void => {
    void this.loadPage(this.page + 1);
  };

  private pushStatus(status: string): void {
    this.onStatus?.(status);
  }
}
