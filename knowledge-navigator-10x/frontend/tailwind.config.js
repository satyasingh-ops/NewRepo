/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deutsche Bank Blue Palette
        db: {
          50: '#e6f0ff',
          100: '#b3cfff',
          200: '#80afff',
          300: '#4d8eff',
          400: '#1a6eff',
          500: '#0052cc',   // Deutsche Bank primary blue
          600: '#003d99',
          700: '#002966',
          800: '#001433',
          900: '#000a1a',
        },
        navy: {
          50: '#e8eaf6',
          100: '#c5cae9',
          500: '#1a237e',
          600: '#0d1b8e',
          700: '#0a147a',
          800: '#060d5c',
          900: '#03073d',
        },
        slate: {
          850: '#1a2332',
          950: '#0d1421',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'db-gradient': 'linear-gradient(135deg, #0052cc 0%, #003d99 50%, #1a237e 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0d1421 0%, #1a2332 50%, #0a1628 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'typing': 'typing 1.5s steps(3, end) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        typing: {
          '0%': { opacity: '0.2' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0.2' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 82, 204, 0.15)',
        'glow': '0 0 20px rgba(0, 82, 204, 0.4)',
        'glow-sm': '0 0 10px rgba(0, 82, 204, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 82, 204, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 40px rgba(0, 82, 204, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
