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
      },
      backgroundImage: {
        'frost-gradient': 'linear-gradient(135deg, transparent, rgba(0, 212, 255, 0.05))',
        'card-border': 'linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.2))',
      },
      animation: {
        'pulse-amber': 'pulse 1s ease-in-out infinite',
        'pulse-breach': 'pulse 0.5s ease-in-out infinite',
        'frost-spread': 'frostSpread 500ms ease-out',
      },
      keyframes: {
        frostSpread: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
