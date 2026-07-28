import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        arctic: {
          navy: '#0F1923',
          deep: '#1B2A4A',
          slate: '#1E293B',
        },
        frost: {
          cyan: '#00D4FF',
          white: '#F1FAEE',
          gray: '#94A3B8',
        },
        status: {
          safe: '#2EC4B6',
          warning: '#FF9F1C',
          breach: '#E63946',
        },
      },
      boxShadow: {
        'frost-glow': '0 0 20px rgba(0, 212, 255, 0.12)',
        'frost-hover': '0 0 30px rgba(0, 212, 255, 0.15)',
        'frost-strong': '0 0 40px rgba(0, 212, 255, 0.2), 0 0 80px rgba(0, 212, 255, 0.08)',
        'frost-card': 'inset 0 1px 0 rgba(0, 212, 255, 0.06), 0 4px 24px rgba(0, 0, 0, 0.15)',
        'neon': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1)',
      },
      backgroundImage: {
        'frost-gradient': 'linear-gradient(135deg, transparent, rgba(0, 212, 255, 0.05))',
        'card-border': 'linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.2))',
        'mesh-gradient': 'radial-gradient(ellipse 50% 50% at 20% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 50%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(27, 42, 74, 0.4) 0%, transparent 50%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(0, 212, 255, 0.06) 50%, transparent 100%)',
      },
      animation: {
        'pulse-amber': 'pulse 1s ease-in-out infinite',
        'pulse-breach': 'pulse 0.5s ease-in-out infinite',
        'frost-spread': 'frostSpread 500ms ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        frostSpread: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
