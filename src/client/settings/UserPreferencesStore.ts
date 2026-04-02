import {
  MAX_CLAN_TAG_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_CLAN_TAG_LENGTH,
  MIN_USERNAME_LENGTH,
  validateClanTag,
  validateUsername,
} from "../../game/validation/username";

export interface UserPreferences {
  username: string;
  clanTag: string;
  language: string;
  darkMode: boolean;
  specialEffects: boolean;
  anonymousNames: boolean;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PreferencesValidationResult {
  ok: boolean;
  message: string;
}

const PREFERENCE_KEYS = {
  username: "username",
  clanTag: "clanTag",
  language: "lang",
  darkMode: "settings.darkMode",
  specialEffects: "settings.specialEffects",
  anonymousNames: "settings.anonymousNames",
} as const;

const DEFAULT_LANGUAGE = "en";

function sanitizeClanTag(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function buildAnonymousUsername(seed?: string): string {
  const source =
    seed ??
    (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`);

  let rolling = 0;
  for (let index = 0; index < source.length; index += 1) {
    rolling = (rolling * 31 + source.charCodeAt(index)) % 1000;
  }

  return `Anon${rolling.toString().padStart(3, "0")}`;
}

function parseBoolean(raw: string | null, fallback: boolean): boolean {
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return fallback;
}

function resolveStorage(override?: StorageLike): StorageLike | null {
  if (override) {
    return override;
  }
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export class UserPreferencesStore {
  private readonly storage: StorageLike | null;
  private preferences: UserPreferences;

  constructor(storage?: StorageLike) {
    this.storage = resolveStorage(storage);
    this.preferences = this.readFromStorage();
    this.applyThemeClass();
  }

  getSnapshot(): UserPreferences {
    return {
      ...this.preferences,
    };
  }

  updateSimple(
    patch: Partial<
      Pick<
        UserPreferences,
        "language" | "darkMode" | "specialEffects" | "anonymousNames"
      >
    >,
  ): UserPreferences {
    this.preferences = {
      ...this.preferences,
      ...patch,
    };
    this.persist();
    this.applyThemeClass();
    return this.getSnapshot();
  }

  updateIdentity(input: {
    username: string;
    clanTag: string;
  }): PreferencesValidationResult {
    const username = input.username.trim();
    const clanTag = sanitizeClanTag(input.clanTag.trim());

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return {
        ok: false,
        message:
          usernameValidation.error ??
          `Username must be ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} characters.`,
      };
    }

    const clanValidation = validateClanTag(clanTag);
    if (!clanValidation.isValid) {
      return {
        ok: false,
        message:
          clanValidation.error ??
          `Clan tag must be ${MIN_CLAN_TAG_LENGTH}-${MAX_CLAN_TAG_LENGTH} letters/numbers.`,
      };
    }

    this.preferences = {
      ...this.preferences,
      username,
      clanTag,
    };
    this.persist();
    return {
      ok: true,
      message: "Profile settings saved.",
    };
  }

  private readFromStorage(): UserPreferences {
    if (!this.storage) {
      return {
        username: buildAnonymousUsername("no-storage"),
        clanTag: "",
        language: DEFAULT_LANGUAGE,
        darkMode: false,
        specialEffects: true,
        anonymousNames: false,
      };
    }

    const existingUsername = this.storage.getItem(PREFERENCE_KEYS.username);
    const username =
      existingUsername && existingUsername.trim().length > 0
        ? existingUsername.trim()
        : buildAnonymousUsername();

    const clanTag = sanitizeClanTag(
      this.storage.getItem(PREFERENCE_KEYS.clanTag) ?? "",
    );
    const language =
      (this.storage.getItem(PREFERENCE_KEYS.language) ?? DEFAULT_LANGUAGE)
        .trim()
        .toLowerCase() || DEFAULT_LANGUAGE;

    return {
      username,
      clanTag,
      language,
      darkMode: parseBoolean(
        this.storage.getItem(PREFERENCE_KEYS.darkMode),
        false,
      ),
      specialEffects: parseBoolean(
        this.storage.getItem(PREFERENCE_KEYS.specialEffects),
        true,
      ),
      anonymousNames: parseBoolean(
        this.storage.getItem(PREFERENCE_KEYS.anonymousNames),
        false,
      ),
    };
  }

  private persist(): void {
    if (!this.storage) {
      return;
    }

    this.storage.setItem(PREFERENCE_KEYS.username, this.preferences.username);
    this.storage.setItem(PREFERENCE_KEYS.clanTag, this.preferences.clanTag);
    this.storage.setItem(PREFERENCE_KEYS.language, this.preferences.language);
    this.storage.setItem(
      PREFERENCE_KEYS.darkMode,
      this.preferences.darkMode ? "true" : "false",
    );
    this.storage.setItem(
      PREFERENCE_KEYS.specialEffects,
      this.preferences.specialEffects ? "true" : "false",
    );
    this.storage.setItem(
      PREFERENCE_KEYS.anonymousNames,
      this.preferences.anonymousNames ? "true" : "false",
    );
  }

  private applyThemeClass(): void {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.toggle("dark", this.preferences.darkMode);
  }
}
