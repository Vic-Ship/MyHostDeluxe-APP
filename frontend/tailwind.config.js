/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./js/**/*.js",
    "./admin/**/*.html",
    "./login/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        secondary: '#fbbf24',
        'bg-dark': '#13233b',
        'bg-light': '#f3f4f6',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}