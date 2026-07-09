/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA6A0A',
          700: '#C2580A',
        },
        navy: {
          DEFAULT: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        slate: {
          200: '#E2E8F0',
          400: '#94A3B8',
          500: '#64748B',
        },
        fresh: '#16A34A',
        stale: '#CA8A04',
        danger: '#DC2626',
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
