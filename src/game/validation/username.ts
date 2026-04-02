import { z } from "zod";

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 27;
export const MIN_CLAN_TAG_LENGTH = 2;
export const MAX_CLAN_TAG_LENGTH = 5;

const UsernameSchema = z
  .string()
  .regex(/^(?=.*\S)[a-zA-Z0-9_ üÜ.]+$/u)
  .min(MIN_USERNAME_LENGTH)
  .max(MAX_USERNAME_LENGTH);

const ClanTagSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]{2,5}$/)
  .nullable();

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

function fallbackTranslate(
  key: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return key;
  }

  const serialized = Object.entries(params)
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(",");
  return `${key}:${serialized}`;
}

export function validateUsername(
  username: string,
  translate: TranslateFn = fallbackTranslate,
): ValidationResult {
  const parsed = UsernameSchema.safeParse(username);
  if (parsed.success) {
    return { isValid: true };
  }

  const firstIssue = parsed.error.issues[0];
  if (firstIssue?.code === "invalid_type") {
    return { isValid: false, error: translate("username.not_string") };
  }
  if (firstIssue?.code === "too_small") {
    return {
      isValid: false,
      error: translate("username.too_short", {
        min: MIN_USERNAME_LENGTH,
      }),
    };
  }
  if (firstIssue?.code === "too_big") {
    return {
      isValid: false,
      error: translate("username.too_long", {
        max: MAX_USERNAME_LENGTH,
      }),
    };
  }

  return { isValid: false, error: translate("username.invalid_chars") };
}

export function validateClanTag(
  clanTag: string,
  translate: TranslateFn = fallbackTranslate,
): ValidationResult {
  if (clanTag.length === 0) {
    return { isValid: true };
  }
  if (clanTag.length < MIN_CLAN_TAG_LENGTH) {
    return {
      isValid: false,
      error: translate("username.tag_too_short"),
    };
  }
  if (clanTag.length > MAX_CLAN_TAG_LENGTH) {
    return {
      isValid: false,
      error: translate("username.tag_too_long"),
    };
  }

  const parsed = ClanTagSchema.safeParse(clanTag);
  if (!parsed.success) {
    return {
      isValid: false,
      error: translate("username.tag_invalid_chars"),
    };
  }

  return { isValid: true };
}
