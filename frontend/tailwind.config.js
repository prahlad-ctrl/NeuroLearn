/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#06060a",
          secondary: "#0c0c14",
          card: "#111119",
          elevated: "#16161f",
          hover: "#1c1c28",
          input: "#0e0e16",
        },
        accent: {
          primary: "#7c3aed",
          secondary: "#a78bfa",
          muted: "#6d28d9",
          glow: "rgba(124, 58, 237, 0.15)",
          cyan: "#06b6d4",
          teal: "#14b8a6",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
          dim: "#475569",
        },
        border: {
          primary: "#1e1e2e",
          secondary: "#2a2a3e",
          hover: "#35354a",
          focus: "#7c3aed",
          glow: "rgba(124, 58, 237, 0.3)",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
        },
        glass: {
          bg: "rgba(17, 17, 25, 0.6)",
          border: "rgba(255, 255, 255, 0.05)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "60px 60px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(124,58,237,0.1)" },
          "100%": { boxShadow: "0 0 40px rgba(124,58,237,0.2)" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(124,58,237,0.15)",
        "glow-md": "0 0 30px rgba(124,58,237,0.2)",
        "glow-lg": "0 0 60px rgba(124,58,237,0.25)",
        "card": "0 4px 24px rgba(0,0,0,0.3)",
        "elevated": "0 8px 40px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
