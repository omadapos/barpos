/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      minHeight: {
        touch: '80px',
      },
      minWidth: {
        touch: '80px',
      },
    },
  },
  plugins: [],
};
