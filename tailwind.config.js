/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    fontFamily: {
      // TODO: what is the Tailwind way to make this the default font class, without overwriting font-sans?
      sans: [
        'Inconsolata',
        'GTAmericaMono-Light',
        'Consolas',
        'Ubuntu Mono',
        'monospace',
        // '-apple-system',
        // 'BlinkMacSystemFont',
        // 'Segoe UI',
        // 'Roboto',
        // 'Oxygen',
        // 'Ubuntu',
        // 'Cantarell',
        // 'Fira Sans',
        // 'Droid Sans',
        // 'Helvetica Neue',
      ],
      mono: [
        'Inconsolata',
        'GTAmericaMono-Light',
        'Consolas',
        'Ubuntu Mono',
        'monospace',
      ],
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
