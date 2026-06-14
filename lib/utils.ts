import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateInput(date: Date | string): string {
  return new Date(date).toISOString().split("T")[0];
}

export const TRAINING_TYPES = [
  "General Training",
  "Boxing",
  "Muay Thai",
  "Wrestling",
  "BJJ",
  "Grappling",
  "Strength",
  "Conditioning",
  "Mobility",
  "Recovery",
] as const;

export const DISCIPLINES = [
  "General Training",
  "Team Sports",
  "Strength Training",
  "Endurance Training",
  "Boxing",
  "Muay Thai",
  "Wrestling",
  "BJJ",
  "Kickboxing",
  "Judo",
] as const;

export const LEVELS: { value: string; label: string; disabled?: boolean }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate Amateur" },
  { value: "professional", label: "Professional (Coming Soon)", disabled: true },
];

export const STRIKING_TECHNIQUES = [
  "Jab",
  "Cross",
  "Left Hook",
  "Right Hook",
  "Left Uppercut",
  "Right Uppercut",
  "Low Kick",
  "Body Kick",
  "Head Kick",
  "Spinning Back Kick",
  "Elbow Strike",
  "Knee Strike",
  "Feint",
  "Counter Right",
  "Slip & Counter",
  "Parry & Counter",
  "Bob & Weave",
] as const;

export const GRAPPLING_TECHNIQUES = [
  "Double Leg Takedown",
  "Single Leg Takedown",
  "High Crotch",
  "Ankle Pick",
  "Takedown Defense",
  "Sprawl",
  "Guard Pass",
  "Half Guard Pass",
  "Butterfly Sweep",
  "Hip Bump Sweep",
  "Rear Naked Choke",
  "Triangle Choke",
  "Armbar",
  "Kimura",
  "Guillotine",
  "Darce Choke",
  "Back Control",
  "Cage Wrestling",
  "Scramble",
  "Escape from Mount",
  "Escape from Back",
] as const;
