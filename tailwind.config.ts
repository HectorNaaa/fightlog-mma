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
        // Palette restricted to exactly 6 colors app-wide: 2 blacks (navy
        // DEFAULT/dark), 2 whites/beiges (beige DEFAULT/light, also used by
        // surface/warm text tokens), 2 reds (burgundy DEFAULT/light). Extra
        // shade keys (dark/muted variants) are kept only so existing
        // className strings across the app keep working, but they now
        // resolve to one of these same 6 canonical colors instead of
        // introducing new hues (no gold/yellow, no third off-palette shade).
        burgundy: {
          DEFAULT: "#8b2635",
          light: "#a63345",
          dark: "#8b2635",
          muted: "#8b2635",
        },
        navy: {
          DEFAULT: "#2a2622",
          light: "#2a2622",
          dark: "#171512",
          muted: "#171512",
        },
        beige: {
          DEFAULT: "#e8e2d6",
          light: "#f0ebe0",
          dark: "#e8e2d6",
          surface: "rgb(var(--color-text-strong) / <alpha-value>)",
          warm: "rgb(var(--color-text-body) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "#e8e2d6",
          light: "#f0ebe0",
          dark: "#e8e2d6",
          muted: "#e8e2d6",
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

