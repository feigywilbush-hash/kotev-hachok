import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["Polin", "system-ui", "sans-serif"],
        hand: ["\"OH Yael Leibushor\"", "Polin", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          shape: "hsl(var(--sidebar-shape))",
        },
        surface: "hsl(var(--surface))",
        progress: {
          track: "hsl(var(--progress-track))",
        },
        brand: {
          sun: "hsl(var(--brand-sun))",
        },
        plate: "hsl(var(--plate))",
        stage: "hsl(var(--stage))",
        answer: "hsl(var(--answer))",
        lime: { DEFAULT: "hsl(var(--lime))", soft: "hsl(var(--lime-soft))" },
        alert: "hsl(var(--alert))",
        mist: "hsl(var(--mist))",
      },
      // Individual translate/scale properties so the animations never clobber Tailwind transforms.
      keyframes: {
        "fade-up": { from: { opacity: "0", translate: "0 12px" }, to: { opacity: "1", translate: "0 0" } },
        "fade-in-scale": { from: { opacity: "0", scale: "0.97" }, to: { opacity: "1", scale: "1" } },
        "grow-x": { from: { scale: "0 1" }, to: { scale: "1 1" } },
        bob: { "0%, 100%": { translate: "0 0" }, "50%": { translate: "0 -6%" } },
        shake: { "0%, 100%": { translate: "0 0" }, "20%, 60%": { translate: "-6px 0" }, "40%, 80%": { translate: "6px 0" } },
        pop: { "0%, 100%": { scale: "1" }, "40%": { scale: "1.18" } },
        "float-away": {
          "0%": { opacity: "0", translate: "0 6px", scale: "0.8" },
          "20%": { opacity: "1", translate: "0 0", scale: "1" },
          "100%": { opacity: "0", translate: "0 -40px", scale: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in-scale": "fade-in-scale 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "grow-x": "grow-x 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        bob: "bob 3.2s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        "float-away": "float-away 1.1s ease-out both",
        pop: "pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
