/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    fontFamily: {
      sans: [
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
      // tbh, not sure if this is how this should be used with Tailwind
      serif: ['GTAmericaMono-Light', 'Consolas', 'Inconsolata', 'monospace'],
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
    },
  },
  plugins: [],
}
