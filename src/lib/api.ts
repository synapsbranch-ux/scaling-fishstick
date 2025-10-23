// src/lib/api.ts
// ----------------------------------------------------
// Waitlist API types + clients (real + mock for DEV)
// ----------------------------------------------------

import { validateEmail, normalizeEmail } from "./validators";

export interface WaitlistPayload {
  name?: string;
  email: string;
  utm?: Record<string, string>;
  referer?: string;
}

// ---- Real REST call (Amplify API Gateway) ----
export async function postWaitlist(
  payload: WaitlistPayload
): Promise<{ ok: true }> {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
  const res = await fetch(`${base}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw { ok: false, status: res.status, message: text || "Request failed" };
  }
  return { ok: true };
}

// ---- Optional mock (handy for local UI dev) ----
export async function postWaitlistMock(
  payload: WaitlistPayload
): Promise<{ ok: true }> {
  const delay = 500 + Math.random() * 200;
  await new Promise((r) => setTimeout(r, delay));

  if (!validateEmail(payload.email)) {
    throw { ok: false, status: 400, message: "Invalid email" };
  }

  if (import.meta.env.DEV) {
    console.log("📩 Mock waitlist submission:", {
      ...payload,
      email: normalizeEmail(payload.email),
      simulatedDelay: Math.round(delay),
    });
  }
  return { ok: true };
}
