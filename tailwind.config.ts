import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C0F2E",
        card: "#2A1743",
        cream: "#FBF7F4",
        pink: "#E85BAE",
        purple: "#7B2CF5",
        lilac: "#C8A6FF",
      },
      fontFamily: {
        display: ["Sailors", "sans-serif"],
        script: ["Lavonia", "cursive"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
