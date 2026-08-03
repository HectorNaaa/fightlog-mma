"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Unhandled client error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-stone-border bg-bg-card p-6 text-center">
        <h2 className="font-condensed text-xl font-black uppercase tracking-[0.14em] text-white">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-stone-light">
          This page ran into an unexpected error. You can try again, or head back to the dashboard.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-stone-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-light hover:text-white"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
