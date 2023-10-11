/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,svelte}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
