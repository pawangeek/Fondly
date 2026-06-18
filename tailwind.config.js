/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fondly token map (HSL → usable Tailwind colors)
        ink: 'hsl(280 50% 5%)',
        surface: 'hsl(280 40% 8%)',
        'surface-2': 'hsl(280 34% 11%)',
        line: 'hsl(280 30% 15%)',
        muted: 'hsl(280 20% 60%)',
        primary: 'hsl(328 86% 59%)',
        secondary: 'hsl(24 95% 53%)',
        accent: 'hsl(285 84% 56%)',
        gold: 'hsl(45 95% 58%)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        glow: '0 0 0 1px hsl(45 95% 58% / 0.7), 0 0 24px hsl(45 95% 58% / 0.35)',
        'glow-pink': '0 0 28px hsl(328 86% 59% / 0.45)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 4s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        pop: 'pop 0.35s cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
