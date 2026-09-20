/**
 * Strix Defensive Engineering Security Utilities for Zen Sudoku.
 * Guarding against bot spam, XSS injection, prototype pollution, and automated timing.
 */

export const FORBIDDEN_NAMES = Object.freeze([
  "__proto__",
  "constructor",
  "prototype",
  "null",
  "undefined",
]);

/**
 * Strips HTML, script tags, style tags, and ASCII control characters from strings.
 */
export function stripTags(str: string | null | undefined): string {
  if (str == null) return "";
  return (
    String(str)
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim()
  );
}

/**
 * Sanitizes player usernames:
 * - Strips all tags and control characters
 * - Restricts to safe alphanumeric, underscores, hyphens, and spaces
 * - Enforces max length of 24 characters
 * - Guards against prototype pollution and reserved keywords
 * - Provides fallback guest name if empty
 */
export function sanitizeUsername(raw: string | null | undefined, fallback?: string): string {
  if (raw == null) return fallback || `ZenPlayer_${Math.floor(1000 + Math.random() * 9000)}`;

  let clean = stripTags(raw)
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);

  if (FORBIDDEN_NAMES.includes(clean.toLowerCase())) {
    clean = "ZenMaster";
  }

  if (!clean) {
    return fallback || `ZenPlayer_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return clean;
}

/**
 * Speed-trap defense: Submissions submitted faster than threshold (default 1800ms)
 * flag automated bot activity.
 */
export function isSpeedTrapTriggered(startTime: number, thresholdMs = 1800): boolean {
  if (!startTime || !Number.isFinite(startTime)) return false;
  return Date.now() - startTime < thresholdMs;
}

/**
 * Dual Honeypot defense: Detects if hidden botcheck field or decoy gotcha input was filled.
 */
export function isHoneypotTriggered(
  botcheck?: boolean | string | null,
  gotcha?: string | null,
): boolean {
  if (botcheck === true || botcheck === "true" || botcheck === "on") return true;
  if (gotcha && typeof gotcha === "string" && gotcha.trim().length > 0) return true;
  return false;
}
