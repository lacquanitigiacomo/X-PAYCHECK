/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        xpay: {
          ink: '#05080b',
          panel: '#0c1218',
          soft: '#131c24',
          line: '#23313b',
          mint: '#68d7be',
          teal: '#2fb596',
          cyan: '#7ddde0',
          amber: '#f6b04b',
          coral: '#ee765f',
        }
      }
    },
  },
  plugins: [],
};
