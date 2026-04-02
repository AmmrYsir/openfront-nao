import { validateClanTag, validateUsername } from "../../game/validation/username";
import type {
  UserPreferenceRow,
  UserPreferencesRepository,
} from "../repositories/types";

const DEFAULT_LANGUAGE = "en";

function buildFallbackUsername(persistentID: string): string {
  const suffix = persistentID.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `Commander-${suffix || "Pilot"}`;
}

function normalizeLanguage(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (/^[a-z]{2}(-[a-z]{2})?$/.test(value)) {
    return value;
  }
  return DEFAULT_LANGUAGE;
}

function sanitizeClanTag(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export interface UpdateUserPreferencesInput {
  username: string;
  clanTag: string;
  language: string;
  darkMode: boolean;
  specialEffects: boolean;
  anonymousNames: boolean;
}

export class UserPreferencesService {
  private readonly repository: UserPreferencesRepository;

  constructor(repository: UserPreferencesRepository) {
    this.repository = repository;
  }

  async getForPersistentID(persistentID: string): Promise<UserPreferenceRow> {
    const existing = await this.repository.getByPersistentID(persistentID);
    if (existing) {
      return existing;
    }

    return {
      username: buildFallbackUsername(persistentID),
      clanTag: "",
      language: DEFAULT_LANGUAGE,
      darkMode: false,
      specialEffects: true,
      anonymousNames: false,
    };
  }

  async upsertForPersistentID(
    persistentID: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferenceRow> {
    const username = input.username.trim();
    const clanTag = sanitizeClanTag(input.clanTag.trim());

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error("invalid_username");
    }

    const clanTagValidation = validateClanTag(clanTag);
    if (!clanTagValidation.isValid) {
      throw new Error("invalid_clan_tag");
    }

    const saved = await this.repository.upsertByPersistentID(persistentID, {
      username,
      clanTag,
      language: normalizeLanguage(input.language),
      darkMode: input.darkMode,
      specialEffects: input.specialEffects,
      anonymousNames: input.anonymousNames,
    });

    if (!saved) {
      throw new Error("user_not_found");
    }

    return saved;
  }
}
