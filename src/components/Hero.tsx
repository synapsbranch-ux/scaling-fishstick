// src/components/Hero.tsx
const Hero = () => {
  const year = new Date().getFullYear();

  return (
    <main className="w-full">
      <section className="coming-soon-card mx-auto">
        {/* Monogramme/logo (optionnel) */}
        <div
          aria-hidden="true"
          className="mx-auto mb-6 grid h-10 w-10 select-none place-items-center rounded-lg bg-zinc-900 text-sm font-semibold text-white"
        >
          SB
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Coming soon
        </h1>

        <p className="mt-3 text-base text-zinc-600 sm:text-lg">
          We’re building something useful. Launching soon.
        </p>

        {/* Placeholder countdown statique (dynamique à la Phase 2) */}
        <div
          className="mt-6 inline-flex items-center gap-3 text-zinc-700"
          aria-label="Countdown to launch"
        >
          <span aria-hidden="true">⏳</span>
          <span className="tabular-nums">00d</span>
          <span className="text-zinc-400">:</span>
          <span className="tabular-nums">00h</span>
          <span className="text-zinc-400">:</span>
          <span className="tabular-nums">00m</span>
          <span className="text-zinc-400">:</span>
          <span className="tabular-nums">00s</span>
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          Join the waitlist — coming next step.
        </p>
      </section>

      <footer className="mt-8 text-center">
        © {year} • All rights reserved
      </footer>
    </main>
  );
};

export default Hero;
