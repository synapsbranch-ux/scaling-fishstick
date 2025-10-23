// src/components/CongratsModal.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  followHref?: string; // optional; defaults to "#"
};

export default function CongratsModal({ open, onClose, followHref = "#" }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<Element | null>(null);

  // Close on Esc, focus trap, and restore focus on close
  useEffect(() => {
    if (!open) return;

    // Save last focused element
    lastFocusRef.current = document.activeElement;

    // Prevent body scroll while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the close button when opening
    const focusTimer = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        // Simple focus trap within the dialog
        const container = dialogRef.current;
        if (!container) return;

        const focusables = container.querySelectorAll<
          HTMLButtonElement | HTMLAnchorElement | HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement).focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to prior element
      if (lastFocusRef.current instanceof HTMLElement) {
        lastFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-labelledby="congrats-title"
      aria-describedby="congrats-desc"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button (top-right) */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-black"
        >
          <span aria-hidden="true">×</span>
        </button>

        <h2 id="congrats-title" className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          You’re on the list 🎉
        </h2>

        <p id="congrats-desc" className="mt-2 text-zinc-600">
          Thanks for your curiosity — we’ll keep you posted.
        </p>

        <div className="mt-6">
          <a
            href={followHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2.5 text-white font-medium hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black"
          >
            Follow us on X
          </a>
        </div>
      </div>
    </div>
  );
}
