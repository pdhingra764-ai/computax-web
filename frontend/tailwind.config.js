/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        },
        india: {
          green: '#138808', darkgreen: '#0a5c05',
          navy: '#1a237e', saffron: '#FF9933', white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'india-gradient': 'linear-gradient(135deg, #FF9933 0%, #1a237e 100%)',
      }
    },
  },
  plugins: [],
};
