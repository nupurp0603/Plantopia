/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#4caf50',
        'primary-dark': '#2e7d32',
        'primary-light': '#e8f5e9',
        background: '#f9fbe7',
      },
    },
  },
  plugins: [],
}
