import type { PublicApiClient, UserMeResponse } from "../../client/api/PublicApiClient";
import type { AuthClient } from "../../client/auth/AuthClient";

interface AccountPageControllerOptions {
  host: HTMLElement;
  authClient: AuthClient;
  apiClient: PublicApiClient;
  onStatus?: (status: string) => void;
}

export class AccountPageController {
  private readonly host: HTMLElement;
  private readonly authClient: AuthClient;
  private readonly apiClient: PublicApiClient;
  private readonly onStatus?: (status: string) => void;

  private refreshButton: HTMLButtonElement | null = null;
  private magicLinkButton: HTMLButtonElement | null = null;
  private logoutButton: HTMLButtonElement | null = null;
  private magicLinkInput: HTMLInputElement | null = null;
  private detailNode: HTMLElement | null = null;

  constructor(options: AccountPageControllerOptions) {
    this.host = options.host;
    this.authClient = options.authClient;
    this.apiClient = options.apiClient;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
  }

  async hydrate(): Promise<void> {
    this.pushStatus("Checking account session...");
    const me = await this.apiClient.getUserMe();
    this.renderUser(me);
  }

  dispose(): void {
    this.refreshButton?.removeEventListener("click", this.handleRefresh);
    this.magicLinkButton?.removeEventListener("click", this.handleMagicLink);
    this.logoutButton?.removeEventListener("click", this.handleLogout);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--account">
        <header class="panel-head">
          <h2>Account</h2>
          <p class="panel-subtitle">Session, identity, and sign-in utilities.</p>
        </header>

        <div class="row-inline">
          <button type="button" data-account-refresh>Refresh Session</button>
          <button type="button" data-account-logout>Log Out</button>
        </div>

        <div class="field-group">
          <label class="field-label" for="account-magic-link-email">Email magic link</label>
          <div class="row-inline">
            <input id="account-magic-link-email" data-account-email type="email" placeholder="pilot@example.com" />
            <button type="button" data-account-magic-link>Send Link</button>
          </div>
        </div>

        <pre class="status-block" data-account-details>Account not loaded.</pre>
      </section>
    `;
  }

  private bind(): void {
    this.refreshButton = this.host.querySelector<HTMLButtonElement>(
      "[data-account-refresh]",
    );
    this.magicLinkButton = this.host.querySelector<HTMLButtonElement>(
      "[data-account-magic-link]",
    );
    this.logoutButton = this.host.querySelector<HTMLButtonElement>(
      "[data-account-logout]",
    );
    this.magicLinkInput = this.host.querySelector<HTMLInputElement>(
      "[data-account-email]",
    );
    this.detailNode = this.host.querySelector<HTMLElement>(
      "[data-account-details]",
    );

    this.refreshButton?.addEventListener("click", this.handleRefresh);
    this.magicLinkButton?.addEventListener("click", this.handleMagicLink);
    this.logoutButton?.addEventListener("click", this.handleLogout);
  }

  private renderUser(me: UserMeResponse | false): void {
    if (!this.detailNode) {
      return;
    }

    if (me === false) {
      this.detailNode.textContent = [
        "authenticated: false",
        `persistent_id: ${this.authClient.getPersistentId()}`,
        "message: no active session",
      ].join("\n");
      this.pushStatus("Account not authenticated yet.");
      return;
    }

    const handle = me.user.discord?.username ?? me.user.email ?? "unknown";
    const elo = me.player.leaderboard?.oneVone?.elo ?? "n/a";
    this.detailNode.textContent = [
      "authenticated: true",
      `player_id: ${me.player.id}`,
      `display_name: ${me.player.displayName}`,
      `handle: ${handle}`,
      `elo: ${String(elo)}`,
    ].join("\n");
    this.pushStatus(`Authenticated as ${handle}.`);
  }

  private readonly handleRefresh = (): void => {
    void this.hydrate();
  };

  private readonly handleMagicLink = (): void => {
    void (async () => {
      const email = this.magicLinkInput?.value.trim() ?? "";
      if (!email) {
        this.pushStatus("Enter an email address first.");
        return;
      }
      this.pushStatus("Sending magic link...");
      const sent = await this.authClient.sendMagicLink(email);
      this.pushStatus(sent ? "Magic link sent." : "Failed to send magic link.");
    })();
  };

  private readonly handleLogout = (): void => {
    void (async () => {
      this.pushStatus("Logging out...");
      const ok = await this.authClient.logOut();
      this.pushStatus(ok ? "Logged out." : "Logout request failed.");
      await this.hydrate();
    })();
  };

  private pushStatus(status: string): void {
    this.onStatus?.(status);
  }
}
