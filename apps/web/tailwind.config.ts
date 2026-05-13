import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        panel: "#ffffff",
        line: "#d9e0ea",
        brand: "#2454ff",
        mint: "#20a67a",
        amber: "#b7791f",
        danger: "#d64545",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
