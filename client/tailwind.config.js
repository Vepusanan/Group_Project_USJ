/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Material-inspired tokens (UI_inspiration)
        background: "#f7f9fb",
        surface: "#f7f9fb",
        "surface-container": "#eceef0",
        "surface-container-low": "#f2f4f6",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e6e8ea",
        "primary-container": "#2563eb",
        "secondary-container": "#4069f2",
        "primary-fixed": "#dbe1ff",
        "outline-variant": "#c3c6d7",
        outline: "#737686",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434655",
        "on-primary": "#ffffff",
        "on-background": "#191c1e",
        // Legacy aliases (existing components)
        page: "#f7f9fb",
        "surface-alt": "#f2f4f6",
        primary: {
          DEFAULT: "#004ac6",
          dark: "#1d4ed8",
          light: "#dbe1ff",
          50: "#dbe1ff",
          100: "#b4c5ff",
          600: "#004ac6",
          700: "#1d4ed8",
        },
        secondary: "#1d4ed8",
        content: {
          DEFAULT: "#191c1e",
          secondary: "#434655",
          muted: "#737686",
          inverse: "#ffffff",
        },
        line: {
          DEFAULT: "#c3c6d7",
          strong: "#737686",
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
          DEFAULT: "#ba1a1a",
          dark: "#93000a",
        },
        "midnight-navy": "#0f172a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
        headline: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-hero": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-hero-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "button-text": ["15px", { lineHeight: "20px", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        card: "24px",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)",
        soft: "0 2px 8px rgba(15, 23, 42, 0.04)",
        premium: "0 4px 20px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)",
        "premium-hover": "0 10px 30px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)",
      },
      maxWidth: {
        container: "1440px",
        "container-max": "1600px",
        discovery: "1440px",
      },
      spacing: {
        gutter: "32px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "section-gap": "120px",
      },
      backgroundImage: {
        "hero-light":
          "linear-gradient(180deg, rgba(0,74,198,0.08) 0%, rgba(247,249,251,1) 100%)",
        "hero-gradient-overlay":
          "linear-gradient(180deg, rgba(0,74,198,0.05) 0%, rgba(247,249,251,1) 100%)",
      },
    },
  },
  plugins: [],
};
