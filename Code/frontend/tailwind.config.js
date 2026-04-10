/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ee',
          100: '#fae3d0',
          200: '#f5c49e',
          300: '#ee9d65',
          400: '#e87a38',
          500: '#e35f1b',
          600: '#c94611',
          700: '#a73310',
          800: '#872915',
          900: '#6e2314',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
