"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type PushStatus = "unsupported" | "checking" | "denied" | "off" | "on" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the service worker and exposes push-notification subscribe state.
 * Works for both mobile (Add to Home Screen / Android Chrome) and desktop browsers.
 */
export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("checking");

  const refreshStatus = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    } catch (error) {
      console.warn("[push] Service worker registration failed", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const enable = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured");
      setStatus("error");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setStatus("on");
    } catch (error) {
      console.warn("[push] Failed to subscribe", error);
      setStatus("error");
    }
  }, []);

  const disable = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch (error) {
      console.warn("[push] Failed to unsubscribe", error);
      setStatus("error");
    }
  }, []);

  return { status, enable, disable };
}

export function PushNotificationToggle({ compact = false }: { compact?: boolean }) {
  const { status, enable, disable } = usePushNotifications();

  if (status === "unsupported") return null;

  const isOn = status === "on";
  const isBusy = status === "checking";

  return (
    <button
      type="button"
      onClick={() => (isOn ? disable() : enable())}
      disabled={isBusy || status === "denied"}
      title={
        status === "denied"
          ? "Notifications blocked in browser settings"
          : isOn
          ? "Push notifications enabled — tap to disable"
          : "Enable push notifications"
      }
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        isOn
          ? "border-burgundy/50 bg-burgundy/20 text-burgundy-light"
          : "border-stone-border text-stone-light hover:text-white",
        compact && "px-1.5"
      )}
    >
      <span aria-hidden>{isOn ? "🔔" : "🔕"}</span>
      {!compact && <span>{status === "denied" ? "Blocked" : isOn ? "Notifications On" : "Enable Alerts"}</span>}
    </button>
  );
}
