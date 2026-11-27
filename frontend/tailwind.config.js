/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Paleta institucional en azul (reemplaza la terracota anterior) con
        // el verde oliva como acento secundario. Todos los componentes usan
        // estos nombres semánticos (primary/secondary/tertiary/...), nunca un
        // color de Tailwind literal, así que el cambio se propaga solo.
        primary: "#1d4e74",
        "primary-dark": "#123049",
        "primary-light": "#bcd4e6",
        "primary-fixed": "#e3edf5",
        secondary: "#3c5937",
        "secondary-light": "#dde8d7",
        "on-secondary-container": "#2a4225",
        tertiary: "#16222d",
        "tertiary-container": "#28404f",
        "on-tertiary-container": "#b8c8d4",
        surface: "#f7f7f9",
        "surface-card": "#ffffff",
        "surface-low": "#f1f2f4",
        "surface-high": "#e4e5e8",
        "on-surface": "#15171a",
        "on-surface-variant": "#43454f",
        outline: "#70717d",
        "outline-variant": "#c1c2cf",
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
