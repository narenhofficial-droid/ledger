/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          50:  '#f5f5f4',
          100: '#e7e5e4',
          400: '#a8a29e',
          500: '#78716c',
          700: '#3a3835',
          800: '#1f1d1b',
          900: '#141312',
          950: '#0a0a0a',
        },
        gold: {
          400: '#d4af37',
          500: '#c5a028',
          600: '#a8861f',
        },
        danger: '#ef4444',
        warn:   '#eab308',
        ok:     '#10b981',
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontVariantNumeric: {
        'tabular-nums': 'tabular-nums',
      },
    },
  },
  plugins: [],
};
