/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          light: '#1A2B3C',
        },
        teal: {
          DEFAULT: '#00B4D8',
          dark: '#0077B6',
        },
        mint: {
          DEFAULT: '#06D6A0',
        },
        slate: {
          DEFAULT: '#2D4356',
        },
        mist: '#E8F4F8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
