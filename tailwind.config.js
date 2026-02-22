/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
        },
        secondary: {
          DEFAULT: '#475569',
          dark: '#334155',
        },
      },
    },
  },
  plugins: [],
}
