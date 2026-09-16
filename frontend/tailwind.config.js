/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8eef7',
          100: '#c5d4ea',
          200: '#9eb7db',
          300: '#759acb',
          400: '#5785bf',
          500: '#3870b4',
          600: '#2d61a3',
          700: '#1f4f8f',
          800: '#133d7a',
          900: '#003087'
        },
        gold: {
          300: '#f5d98a',
          400: '#ecc84e',
          500: '#C8960C',
          600: '#a67a08',
          700: '#845f05'
        },
        saffron: '#FF9933',
        indiaGreen: '#138808'
      },
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
