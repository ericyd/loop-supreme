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
    extend: {},
  },
  plugins: [],
}
