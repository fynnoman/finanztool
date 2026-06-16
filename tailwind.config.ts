import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Refined business-tool palette — calm slate + warm accent.
        ink: {
          900: "#0B0F14",
          800: "#111722",
          700: "#1A2230",
          600: "#26303F",
          500: "#3A4554",
          400: "#5A6675",
          300: "#8E97A4",
          200: "#C2C8D2",
          100: "#E6EAF0",
          50: "#F4F6F9",
        },
        // Bronze / brand accent — warm, serious, not Bootstrap-blue.
        bronze: {
          900: "#3A2410",
          800: "#5C3A1B",
          700: "#7A4D26",
          600: "#9E6432",
          500: "#C2823F",
          400: "#D89B5A",
          300: "#E8B780",
          200: "#F0D2AA",
          100: "#F8E8D2",
          50: "#FBF4E8",
        },
        paper: "#FAF7F2",
      },
      fontFamily: {
        sans: ['"Inter Tight"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Newsreader"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(15, 22, 32, 0.04), 0 1px 2px rgba(15, 22, 32, 0.06)",
        soft: "0 2px 6px rgba(15, 22, 32, 0.05), 0 12px 32px -8px rgba(15, 22, 32, 0.08)",
      },
    },
  },
  plugins: [forms, typography],
};

export default config;
