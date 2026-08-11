import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export const REFRESH_COOKIE = "refresh_token";

/**
 * Resolve the JWT signing secret. Missing config is a hard boot failure in
 * production — a guessable fallback there would let anyone forge tokens.
 * In development we keep a fixed value for convenience, but say so loudly.
 */
export function requireJwtSecret(config: ConfigService): string {
  const secret = config.get<string>("JWT_ACCESS_SECRET");
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_ACCESS_SECRET is not set. Refusing to start in production without a signing secret.",
    );
  }
  new Logger("Auth").warn(
    "JWT_ACCESS_SECRET is not set — using an insecure development-only secret.",
  );
  return "insecure-dev-secret";
}

/**
 * Parse a short duration string like "15m", "7d", "30s", "12h" into milliseconds.
 * Falls back to the provided default when the input is missing or malformed.
 */
export function parseDurationToMs(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * unitMs[unit];
}
