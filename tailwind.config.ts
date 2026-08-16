import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "animate-float-slow",
    "animate-float-med",
    "animate-drift",
    "animate-pulse-ring",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
          card: "rgb(var(--color-bg-card) / <alpha-value>)",
          elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
        },
        burgundy: {
          DEFAULT: "#8b2635",
          light: "#a63345",
          dark: "#6d1e29",
          muted: "#5a1a22",
        },
        navy: {
          DEFAULT: "#2a2622",
          light: "#453f38",
          dark: "#171512",
          muted: "#0f0d0b",
        },
        beige: {
          DEFAULT: "#c4a882",
          light: "#d4bc9e",
          dark: "#a8906a",
          surface: "rgb(var(--color-text-strong) / <alpha-value>)",
          warm: "rgb(var(--color-text-body) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "#c4a882",
          light: "#d4bc9e",
          dark: "#a8906a",
          muted: "#8c7550",
        },
        stone: {
          border: "rgb(var(--color-stone-border) / <alpha-value>)",
          muted: "rgb(var(--color-stone-muted) / <alpha-value>)",
          text: "rgb(var(--color-stone-text) / <alpha-value>)",
          light: "rgb(var(--color-stone-light) / <alpha-value>)",
        },
        line: "rgb(var(--color-line) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        condensed: ["var(--font-barlow)", "Impact", "Arial Narrow", "sans-serif"],
      },
      backgroundImage: {
        "noise": "url('/noise.svg')",
      },
    },
  },
  plugins: [],
};
export default config;

