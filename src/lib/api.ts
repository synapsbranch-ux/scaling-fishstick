// src/lib/api.ts
// ----------------------------------------------------
// Mock API client for waitlist submissions
// Simulates latency and mimics future REST signature
// ----------------------------------------------------

import { validateEmail, normalizeEmail } from "./validators";

export interface WaitlistPayload {
  name?: string;
  email: string;
  utm?: Record<string, string>;
  referer?: string;
}

/**
 * Mock POST /waitlist
 * Simulates latency (500–700 ms)
 * Returns { ok: true } for valid email
 * Throws error object { ok:false, status:400 } if invalid
 */
export async function postWaitlistMock(
  payload: WaitlistPayload
): Promise<{ ok: true }> {
  // simulate network latency between 500–700 ms
  const delay = 500 + Math.random() * 200;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // validate defensively
  if (!validateEmail(payload.email)) {
    throw { ok: false, status: 400, message: "Invalid email" };
  }

  // normalize email before returning success (for consistency)
  const normalizedEmail = normalizeEmail(payload.email);

  // log to dev console for debugging
  if (import.meta.env.DEV) {
    console.log("📩 Mock waitlist submission:", {
      ...payload,
      email: normalizedEmail,
      simulatedDelay: Math.round(delay),
    });
  }

  return { ok: true };
}
