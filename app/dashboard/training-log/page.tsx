"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Training Log now lives embedded at the bottom of the main Dashboard
// (scrollable history under the stats/metrics). This route is kept only so
// old bookmarks/links don't 404 — it redirects straight to /dashboard.
export default function TrainingLogRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
