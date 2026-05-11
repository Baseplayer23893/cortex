import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        overlay: "var(--bg-overlay)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        green: "var(--green)",
        amber: "var(--amber)",
        red: "var(--red)",
        blue: "var(--blue)",
      },
    },
  },
  plugins: [],
} satisfies Config