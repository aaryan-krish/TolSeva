/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff5ec',
          100: '#ffe8d3',
          200: '#ffd0a3',
          300: '#ffb368',
          400: '#ff9933',
          500: '#f58216',
          600: '#d9680b',
          700: '#b44f0b',
          800: '#903d10',
          900: '#753410',
          950: '#3f1805',
        },
        green: {
          50: '#f0fdf2',
          100: '#dcfce4',
          200: '#bcf6cb',
          300: '#86eaa3',
          400: '#48d575',
          500: '#21b656',
          600: '#138808',
          700: '#14760f',
          800: '#136112',
          900: '#115011',
          950: '#082c0a',
        },
        indiaGreen: '#138808'
      },
      fontFamily: {
        sans: ['Noto Sans', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
