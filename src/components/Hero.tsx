// src/components/Hero.tsx
import Countdown from "./Countdown";

const Hero = () => {
  const year = new Date().getFullYear();

  return (
    <main className="w-full">
      <section className="coming-soon-card mx-auto text-center max-w-xl rounded-2xl bg-white shadow-lg p-8 sm:p-10">
        {/* Monogramme/logo */}
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

        {/* Countdown dynamique */}
        <Countdown />

        <p className="mt-6 text-sm text-zinc-500">
          Join the waitlist — coming next step.
        </p>
      </section>

      <footer className="mt-8 text-center text-xs text-zinc-400">
        © {year} • All rights reserved
      </footer>
    </main>
  );
};

export default Hero;
