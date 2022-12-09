/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    fontFamily: {
      // This feels strange but I think this is the "right" way to set a default tailwind font.
      // Additional fonts defined here can be used in place of sans
      sans: [
        'Inconsolata',
        'GTAmericaMono-Light',
        'Consolas',
        'Ubuntu Mono',
        'monospace',
      ],
      'sans-real': [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
      ],
    },
    colors: {
      // taken from https://tailwindcss.com/docs/customizing-colors
      black: '#18181b',
      white: '#f9fafb',
      'light-gray': '#a1a1aa',
      'dark-gray': '#4b5563',
      blue: '#bfdbfe',
      red: '#f87171',
      orange: '#fb923c',
    },
    extend: {
      animation: {
        'pulse-custom': 'pulse-custom 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
      },
      boxShadow: {
        button: '0 0 0 2px #528eb0ff',
      },
    },
  },
  plugins: [],
}
