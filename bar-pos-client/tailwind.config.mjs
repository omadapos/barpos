/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
        'glow-amber': '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
    },
  },
  plugins: [],
};
