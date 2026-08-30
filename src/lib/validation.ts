/** Minimal server-side validation helpers (no external dep). */

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isNonEmpty(v: string): boolean {
  return v.trim().length > 0;
}

export function isStrongPassword(v: string): boolean {
  return v.length >= 8;
}

export function clampInt(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function isISODate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function sanitizeText(v: unknown): string {
  return String(v ?? '').slice(0, 5000);
}

export type ValidationResult = { ok: true } | { ok: false; errors: Record<string, string> };

export function validateFields(
  data: Record<string, unknown>,
  rules: Record<string, (v: unknown) => string | null>,
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const [field, rule] of Object.entries(rules)) {
    const err = rule(data[field]);
    if (err) errors[field] = err;
  }
  return Object.keys(errors).length === 0 ? { ok: true } : { ok: false, errors };
}
