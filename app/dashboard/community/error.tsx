"use client";

import { useEffect } from "react";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[community] Unhandled client error", error);
  }, [error]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-border bg-bg-card p-6 text-center">
        <h2 className="font-condensed text-xl font-black uppercase tracking-[0.14em] text-white">
          Community hit a snag
        </h2>
        <p className="mt-2 text-sm text-stone-light">
          Something went wrong loading the social hub. This has been logged — try again.
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-burgundy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-burgundy-light"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
