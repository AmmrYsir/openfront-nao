import type {
  UserPreferences,
  UserPreferencesStore,
} from "../../client/settings/UserPreferencesStore";

interface SettingsPageControllerOptions {
  host: HTMLElement;
  preferencesStore: UserPreferencesStore;
  onStatus?: (status: string) => void;
}

export class SettingsPageController {
  private readonly host: HTMLElement;
  private readonly preferencesStore: UserPreferencesStore;
  private readonly onStatus?: (status: string) => void;

  private usernameInput: HTMLInputElement | null = null;
  private clanTagInput: HTMLInputElement | null = null;
  private languageSelect: HTMLSelectElement | null = null;
  private darkModeToggle: HTMLInputElement | null = null;
  private fxToggle: HTMLInputElement | null = null;
  private anonymousToggle: HTMLInputElement | null = null;
  private profilePreviewNode: HTMLElement | null = null;
  private saveIdentityButton: HTMLButtonElement | null = null;
  private saveRuntimeButton: HTMLButtonElement | null = null;

  constructor(options: SettingsPageControllerOptions) {
    this.host = options.host;
    this.preferencesStore = options.preferencesStore;
    this.onStatus = options.onStatus;

    this.render();
    this.bind();
    this.applySnapshot(this.preferencesStore.getSnapshot());
  }

  hydrate(): void {
    this.applySnapshot(this.preferencesStore.getSnapshot());
  }

  dispose(): void {
    this.saveIdentityButton?.removeEventListener("click", this.handleSaveIdentity);
    this.saveRuntimeButton?.removeEventListener("click", this.handleSaveRuntime);
    this.usernameInput?.removeEventListener("input", this.handlePreviewChange);
    this.clanTagInput?.removeEventListener("input", this.handlePreviewChange);
  }

  private render(): void {
    this.host.innerHTML = `
      <section class="feature-panel feature-panel--settings">
        <header class="panel-head">
          <h2>Settings</h2>
          <p class="panel-subtitle">Migrated profile/runtime preferences from legacy local settings.</p>
        </header>

        <section class="field-group">
          <label class="field-label" for="settings-username">Username</label>
          <input id="settings-username" data-settings-username maxlength="27" />
        </section>

        <section class="field-group">
          <label class="field-label" for="settings-clan">Clan Tag</label>
          <input id="settings-clan" data-settings-clan maxlength="5" />
        </section>

        <p class="meta-pill" data-settings-preview>Profile: -</p>

        <div class="row-inline">
          <button type="button" data-settings-save-identity>Save Profile</button>
        </div>

        <section class="field-group">
          <label class="field-label" for="settings-language">Language</label>
          <select id="settings-language" data-settings-language>
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="es">Espanol</option>
            <option value="fr">Francais</option>
            <option value="de">Deutsch</option>
            <option value="pt">Portugues</option>
            <option value="tr">Turkce</option>
            <option value="ru">Russkiy</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </section>

        <label class="toggle-row">
          <input type="checkbox" data-settings-dark-mode />
          <span>Dark mode</span>
        </label>

        <label class="toggle-row">
          <input type="checkbox" data-settings-fx />
          <span>Special effects</span>
        </label>

        <label class="toggle-row">
          <input type="checkbox" data-settings-anon />
          <span>Anonymous names</span>
        </label>

        <div class="row-inline">
          <button type="button" data-settings-save-runtime>Save Runtime Settings</button>
        </div>
      </section>
    `;
  }

  private bind(): void {
    this.usernameInput = this.host.querySelector<HTMLInputElement>(
      "[data-settings-username]",
    );
    this.clanTagInput = this.host.querySelector<HTMLInputElement>(
      "[data-settings-clan]",
    );
    this.languageSelect = this.host.querySelector<HTMLSelectElement>(
      "[data-settings-language]",
    );
    this.darkModeToggle = this.host.querySelector<HTMLInputElement>(
      "[data-settings-dark-mode]",
    );
    this.fxToggle = this.host.querySelector<HTMLInputElement>("[data-settings-fx]");
    this.anonymousToggle = this.host.querySelector<HTMLInputElement>(
      "[data-settings-anon]",
    );
    this.profilePreviewNode = this.host.querySelector<HTMLElement>(
      "[data-settings-preview]",
    );
    this.saveIdentityButton = this.host.querySelector<HTMLButtonElement>(
      "[data-settings-save-identity]",
    );
    this.saveRuntimeButton = this.host.querySelector<HTMLButtonElement>(
      "[data-settings-save-runtime]",
    );

    this.saveIdentityButton?.addEventListener("click", this.handleSaveIdentity);
    this.saveRuntimeButton?.addEventListener("click", this.handleSaveRuntime);
    this.usernameInput?.addEventListener("input", this.handlePreviewChange);
    this.clanTagInput?.addEventListener("input", this.handlePreviewChange);
  }

  private applySnapshot(snapshot: UserPreferences): void {
    if (this.usernameInput) {
      this.usernameInput.value = snapshot.username;
    }
    if (this.clanTagInput) {
      this.clanTagInput.value = snapshot.clanTag;
    }
    if (this.languageSelect) {
      this.languageSelect.value = snapshot.language;
    }
    if (this.darkModeToggle) {
      this.darkModeToggle.checked = snapshot.darkMode;
    }
    if (this.fxToggle) {
      this.fxToggle.checked = snapshot.specialEffects;
    }
    if (this.anonymousToggle) {
      this.anonymousToggle.checked = snapshot.anonymousNames;
    }

    this.updateProfilePreview();
  }

  private updateProfilePreview(): void {
    if (!this.profilePreviewNode) {
      return;
    }

    const username = this.usernameInput?.value.trim() ?? "";
    const clanTag = this.clanTagInput?.value.trim().toUpperCase() ?? "";
    const display = clanTag.length > 0 ? `[${clanTag}] ${username}` : username;
    this.profilePreviewNode.textContent = `Profile: ${display || "-"}`;
  }

  private readonly handlePreviewChange = (): void => {
    this.updateProfilePreview();
  };

  private readonly handleSaveIdentity = (): void => {
    const result = this.preferencesStore.updateIdentity({
      username: this.usernameInput?.value ?? "",
      clanTag: this.clanTagInput?.value ?? "",
    });

    if (!result.ok) {
      this.pushStatus(result.message);
      return;
    }

    this.applySnapshot(this.preferencesStore.getSnapshot());
    this.pushStatus("Profile settings saved locally.");
  };

  private readonly handleSaveRuntime = (): void => {
    const language = this.languageSelect?.value ?? "en";
    const darkMode = this.darkModeToggle?.checked ?? false;
    const specialEffects = this.fxToggle?.checked ?? true;
    const anonymousNames = this.anonymousToggle?.checked ?? false;

    this.preferencesStore.updateSimple({
      language,
      darkMode,
      specialEffects,
      anonymousNames,
    });
    this.pushStatus("Runtime settings saved locally.");
  };

  private pushStatus(status: string): void {
    this.onStatus?.(status);
  }
}
