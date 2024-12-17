// import { COLORS } from '@'

import { COLORS } from './src/constants/color.constants.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: COLORS,
    },
  },
  plugins: [],
}

