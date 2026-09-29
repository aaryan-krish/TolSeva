/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Digital Brand Identity Manual (DBIM 3.0) Official Blue Palette
        dbim: {
          blue: {
            DEFAULT: '#162F6A', // Key Colour (Darkest shade)
            dark: '#162F6A',
            royal: '#214AAB',  // Variant 2
            accent: '#5279D7', // Variant 3
            light: '#A3BBF3',  // Variant 4
            tint: '#D2DFFF'    // Variant 5
          },
          // Functional palette
          linen: '#EBEAEA',
          white: '#FFFFFF',
          brown: '#150202',   // Deep Earthy Brown text
          govblue: '#1D0A69', // Deep Blue (Gov.in Root)
          success: '#198754', // Liberty Green
          warning: '#FFC107', // Mustard Yellow
          error: '#DC3545',   // Coral Red
          info: '#0D6EFD',    // Blue link/status
          grey: {
            1: '#C6C6C6',
            2: '#8E8E8E',
            3: '#606060'
          }
        },
        primary: {
          DEFAULT: '#162F6A',
          50: '#F0F4FF',
          100: '#D2DFFF',
          200: '#A3BBF3',
          300: '#5279D7',
          400: '#214AAB',
          500: '#162F6A',
          600: '#13285B',
          700: '#10214C',
          800: '#0C1A3C',
          900: '#08122A'
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
        display: ['Noto Sans', 'system-ui', 'sans-serif'],
        heading: ['Noto Sans', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
