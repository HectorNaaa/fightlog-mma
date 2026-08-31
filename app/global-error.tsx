"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unhandled global client error", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-bg-primary px-4 text-beige-warm">
        <div className="w-full max-w-md rounded-xl border border-stone-border bg-bg-card p-6 text-center">
          <div className="inline-flex items-center gap-2 font-condensed text-2xl font-black tracking-[0.2em] text-white">
            <img src="/logo/fightlog-mark.png" alt="FightLog" className="h-7 w-7" />
            FIGHT<span className="text-burgundy-light">LOG</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-stone-light">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
