import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#102414",
          800: "#15301A",
          700: "#1E4022",
          600: "#2A4F31",
          500: "#3D6043",
          400: "#5D7B62",
          300: "#8AA391",
          200: "#BFD3C4",
          100: "#E2ECE4",
          50: "#F1F6F2",
        },
        // Garten- und Landschaftsbau Eifler — Blattgrün als Hauptakzent.
        bronze: {
          900: "#0F3A11",
          800: "#19551A",
          700: "#247024",
          600: "#2E8B2E",
          500: "#46A744",
          400: "#67BC55",
          300: "#8FD06A",
          200: "#BCE39A",
          100: "#DFF2C8",
          50: "#F0FAE5",
        },
        paper: "#F7FBF4",
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
