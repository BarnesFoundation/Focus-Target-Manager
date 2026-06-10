import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        barnes: {
          ink: "#0F1212",
          paper: "#F9F6F0",
          accent: "#8B6F47",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
