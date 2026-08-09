import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "jungle-teal": "#6b9080",
        "muted-teal": "#a4c3b2",
        "frozen-water": "#cce3de",
        "azure-mist": "#eaf4f4",
        "mint-cream": "#f6fff8",
        brand: {
          50: "#f6fff8",
          100: "#eaf4f4",
          200: "#cce3de",
          300: "#a4c3b2",
          500: "#6b9080",
          600: "#567569",
          700: "#435c52",
        },
      },
    },
  },
  plugins: [],
};

export default config;
