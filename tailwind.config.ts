import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#111111",
          secondary: "#1a1a1a",
          card: "#1e1e1e",
          elevated: "#242424",
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
          surface: "#f0ebe0",
          warm: "#e8e0d0",
        },
        amber: {
          DEFAULT: "#d4a017",
          light: "#e6b420",
          dark: "#b8880d",
          muted: "#9a7010",
        },
        stone: {
          border: "#2a2a2a",
          muted: "#3a3a3a",
          text: "#8a8278",
          light: "#b0a898",
        },
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

