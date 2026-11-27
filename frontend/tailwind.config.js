/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Paleta sobre los tonos cálidos del logo de Funproeib (pueblos
        // andinos: tierra, terracota, oliva), afinada para más contraste y
        // un acabado más sobrio/institucional. Todos los componentes usan
        // estos nombres semánticos (primary/secondary/tertiary/...), nunca un
        // color de Tailwind literal, así que el cambio se propaga solo.
        primary: "#8c3f26",
        "primary-dark": "#5c2415",
        "primary-light": "#e8c9ae",
        "primary-fixed": "#f3e2d8",
        secondary: "#3c5937",
        "secondary-light": "#dde8d7",
        "on-secondary-container": "#2a4225",
        tertiary: "#2e1a17",
        "tertiary-container": "#54342c",
        "on-tertiary-container": "#cbb49f",
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
