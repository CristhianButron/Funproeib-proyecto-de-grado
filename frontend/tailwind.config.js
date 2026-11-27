/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Paleta reconstruida sobre los tonos cálidos del logo de Funproeib
        // (pueblos andinos: tierra, terracota, oliva) en vez del azul/gris
        // genérico de dashboard que tenía antes. Todos los componentes usan
        // estos nombres semánticos (primary/secondary/tertiary/...), nunca un
        // color de Tailwind literal, así que el cambio se propaga solo.
        primary: "#9a4a2e",
        "primary-dark": "#6b2c1c",
        "primary-light": "#e8c9ae",
        "primary-fixed": "#f3e2d8",
        secondary: "#45633f",
        "secondary-light": "#dde8d7",
        "on-secondary-container": "#2f4a2a",
        tertiary: "#3d2420",
        "tertiary-container": "#54342c",
        "on-tertiary-container": "#cbb49f",
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
