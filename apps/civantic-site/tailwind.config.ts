import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/**/components/**/*.{ts,tsx}",
    "../../packages/**/ui/**/*.{ts,tsx}"
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f4f7ff",
          100: "#e8efff",
          200: "#cddcff",
          300: "#a2bfff",
          400: "#6f99ff",
          500: "#3d73ff",
          600: "#2456db",
          700: "#1d45ad",
          800: "#1a3a8a",
          900: "#182f6e"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
}

export default config
