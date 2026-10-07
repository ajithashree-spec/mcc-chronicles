/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mcc-maroon': {
          DEFAULT: '#6b1420',
          dark: '#480c14',
          light: '#8c1d2e',
        },
        'mcc-navy': {
          DEFAULT: '#132238',
          dark: '#0b1523',
          light: '#203450',
        },
        'mcc-gold': {
          DEFAULT: '#c59b27',
          dark: '#a37f1b',
          light: '#dfb743',
        },
        'mcc-paper': '#fbf9f4',
        'mcc-halfwhite': '#f5f2eb',
        // Institutional aliases & legacy palette
        mcc: {
          maroon: '#6b1420',
          navy: '#132238',
          gold: '#c59b27',
          paper: '#fbf9f4',
          halfwhite: '#f5f2eb',
          oxblood: '#4A1521',
          heritage: '#6B2130',
          shadow: '#340B15',
          brass: '#c59b27',
          champagne: '#F4EBD9',
          midnight: '#132238',
          alabaster: '#fbf9f4',
          border: '#E8E5DD',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
