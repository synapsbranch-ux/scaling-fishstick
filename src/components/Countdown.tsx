// src/components/Countdown.tsx
import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown = () => {
  const targetIso = import.meta.env.VITE_COUNTDOWN_ISO;
  const targetDate = targetIso ? new Date(targetIso) : null;

  const calculateTimeLeft = (): TimeLeft | null => {
    if (!targetDate || isNaN(targetDate.getTime())) return null;

    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!targetDate || isNaN(targetDate.getTime())) {
    return (
      <p className="mt-6 text-sm text-zinc-500">
        Launch date not configured.
      </p>
    );
  }

  if (!timeLeft) {
    return (
      <p className="mt-6 text-sm text-zinc-500">Calculating...</p>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;
  const finished =
    days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0;

  if (finished) {
    return (
      <p
        className="mt-6 text-lg font-medium text-zinc-700"
        aria-live="polite"
      >
        🎉 Launching soon!
      </p>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="mt-6 flex items-center justify-center gap-4"
      aria-live="polite"
    >
      <div className="rounded-xl bg-white shadow px-4 py-3 text-center">
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {days}
        </div>
        <div className="text-xs text-zinc-500 mt-1">Days</div>
      </div>
      <div className="rounded-xl bg-white shadow px-4 py-3 text-center">
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {pad(hours)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">Hours</div>
      </div>
      <div className="rounded-xl bg-white shadow px-4 py-3 text-center">
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {pad(minutes)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">Min</div>
      </div>
      <div className="rounded-xl bg-white shadow px-4 py-3 text-center">
        <div className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {pad(seconds)}
        </div>
        <div className="text-xs text-zinc-500 mt-1">Sec</div>
      </div>
    </div>
  );
};

export default Countdown;
