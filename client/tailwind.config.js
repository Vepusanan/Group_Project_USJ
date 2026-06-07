/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page: {
          DEFAULT: "#F8FAFC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F8FAFC",
        },
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF6FF",
          50: "#EFF6FF",
          100: "#DBEAFE",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        content: {
          DEFAULT: "#0F172A",
          secondary: "#475569",
          muted: "#475569",
          inverse: "#FFFFFF",
        },
        line: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
        success: {
          DEFAULT: "#10B981",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#EF4444",
          dark: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 4px 24px rgba(15, 23, 42, 0.06)",
        soft: "0 2px 8px rgba(15, 23, 42, 0.04)",
      },
      backgroundImage: {
        "hero-light":
          "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 60%, #F8FAFC 100%)",
      },
    },
  },
  plugins: [],
};
