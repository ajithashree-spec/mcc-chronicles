/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mcc: {
          oxblood: '#4A1521',
          heritage: '#6B2130',
          shadow: '#340B15',
          brass: '#B88E3D',
          champagne: '#F4EBD9',
          midnight: '#16202C',
          alabaster: '#FBFBF9',
          border: '#E8E5DD'
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
