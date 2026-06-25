/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a",
        "primary-dark": "#00236f",
        "primary-light": "#90a8ff",
        "primary-fixed": "#dce1ff",
        secondary: "#006c49",
        "secondary-light": "#6cf8bb",
        "on-secondary-container": "#00714d",
        tertiary: "#232a36",
        "tertiary-container": "#39404d",
        "on-tertiary-container": "#a5acbb",
        surface: "#f8f9fb",
        "surface-card": "#ffffff",
        "surface-low": "#f3f4f6",
        "surface-high": "#e7e8ea",
        "on-surface": "#191c1e",
        "on-surface-variant": "#444651",
        outline: "#757682",
        "outline-variant": "#c5c5d3",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        // Tonos del logo (identidad Funproeib)
        "brand-brown": "#5a2820",
        "brand-tan": "#c9a063",
        "brand-terracotta": "#c06a4a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        "card-hover": "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};
