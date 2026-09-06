// Identifies "this device/browser" for local-only file attachments so the UI
// can tell the user where a file was actually saved (files never leave the
// device — see lib/local-files.ts). Purely client-side, no server calls.
"use client";

const DEVICE_ID_KEY = "fightlog_device_id";
const DEVICE_NAME_KEY = "fightlog_device_name";

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function detectDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;

  let os = "Unknown OS";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iPhone/iPad";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Macintosh/.test(ua)) os = "Mac";
  else if (/Windows/.test(ua)) os = "Windows PC";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  return `${os} - ${browser}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Unknown device";
  let name = localStorage.getItem(DEVICE_NAME_KEY);
  if (!name) {
    name = detectDeviceLabel();
    localStorage.setItem(DEVICE_NAME_KEY, name);
  }
  return name;
}

export function setDeviceName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_NAME_KEY, name.trim().slice(0, 60) || detectDeviceLabel());
}
