// src/components/SignupForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { postWaitlist, type WaitlistPayload } from "../lib/api";
import { validateEmail, validateName } from "../lib/validators";

type Props = {
  onSuccess: () => void;
};

type FieldErrors = {
  name?: string;
  email?: string;
  general?: string;
};

export default function SignupForm({ onSuccess }: Props) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false); // optional, not enforced yet
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Capture UTM once
  const utmRef = useRef<Record<string, string>>({});
  // Capture referer once
  const refererRef = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || "";
    const medium = params.get("utm_medium") || "";
    const campaign = params.get("utm_campaign") || "";

    const utm: Record<string, string> = {};
    if (source) utm.utm_source = source;
    if (medium) utm.utm_medium = medium;
    if (campaign) utm.utm_campaign = campaign;
    utmRef.current = utm;

    refererRef.current = document.referrer || "";
  }, []);

  function validateFields(): boolean {
    const newErrors: FieldErrors = {};

    // Name (optional)
    if (!validateName(name)) {
      newErrors.name =
        "Name must be 2–60 characters (letters, spaces, or hyphens).";
    }

    // Email (required)
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, general: undefined }));

    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const payload: WaitlistPayload = {
        name: name.trim() || undefined,
        email,
        utm: utmRef.current,
        referer: refererRef.current,
      };

      await postWaitlist(payload);

      // Clear field-level errors on success
      setErrors({});
      onSuccess();
    } catch (err: any) {
      // Defensive: normalize error shape
      const message =
        err?.message ??
        (err?.status === 400
          ? "That email looks invalid. Please try again."
          : "Something went wrong. Please try again.");
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      {/* Global error (top) */}
      {errors.general && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Name (optional) */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-zinc-800">
          Name <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          inputMode="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-600 mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email (required) */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
          Email <span className="text-red-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-600 mt-1">
            {errors.email}
          </p>
        )}
      </div>

      {/* Consent (optional for now) */}
      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-300 text-black focus:ring-2 focus:ring-black"
        />
        <label htmlFor="consent" className="text-sm text-zinc-700">
          I agree to receive occasional updates about the launch.
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-black text-white py-2.5 font-medium disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black"
      >
        {loading ? "Submitting…" : "Join the waitlist"}
      </button>
    </form>
  );
}
