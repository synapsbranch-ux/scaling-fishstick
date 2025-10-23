// src/lib/validators.ts
// ---------------------------------------------
// Simple validators for the waitlist form
// ---------------------------------------------

/**
 * Normalize email: trim, lowercase
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Basic email validation
 * - must contain "@"
 * - at least one dot after "@"
 * - max length 254 chars (per RFC)
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  if (normalized.length > 254) return false;
  // simple but safe regex for email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

/**
 * Optional name validation
 * - allow empty (optional field)
 * - otherwise: 2–60 chars, letters, spaces, hyphens
 */
export function validateName(name?: string): boolean {
  if (!name) return true; // optional
  const trimmed = name.trim();
  if (trimmed.length === 0) return true; // still optional
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  // accept letters (including accented), spaces, and hyphens
  const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/u;
  return nameRegex.test(trimmed);
}
