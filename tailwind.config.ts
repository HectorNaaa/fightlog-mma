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
          DEFAULT: "#2d3a5e",
          light: "#3d4f7c",
          dark: "#1e2840",
          muted: "#1a2238",
        },
        beige: {
          DEFAULT: "#c4a882",
          light: "#d4bc9e",
          dark: "#a8906a",
          surface: "rgb(var(--color-text-strong) / <alpha-value>)",
          warm: "rgb(var(--color-text-body) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "#d4a017",
          light: "#e6b420",
          dark: "#b8880d",
          muted: "#9a7010",
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

