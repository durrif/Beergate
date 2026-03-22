// frontend/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Craft Brewery Control Room Design Tokens
        bg: {
          primary: '#0A0A0B',
          card: '#141416',
          elevated: '#1C1C1F',
          hover: '#252528',
        },
        accent: {
          DEFAULT: '#D4A04A',
          foreground: '#0A0A0B',
          amber: '#D4A04A',
          'amber-bright': '#F59E0B',
          copper: '#B87333',
          foam: '#FFF8E7',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#A1A1AA',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
        // Shadcn-compatible tokens mapped to brewery theme
        border: 'rgba(255,255,255,0.08)',
        input: '#1C1C1F',
        ring: '#D4A04A',
        background: '#0A0A0B',
        foreground: '#F5F5F5',
        primary: {
          DEFAULT: '#D4A04A',
          foreground: '#0A0A0B',
        },
        secondary: {
          DEFAULT: '#1C1C1F',
          foreground: '#F5F5F5',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F5F5F5',
        },
        muted: {
          DEFAULT: '#141416',
          foreground: '#A1A1AA',
        },
        popover: {
          DEFAULT: '#1C1C1F',
          foreground: '#F5F5F5',
        },
        card: {
          DEFAULT: '#141416',
          foreground: '#F5F5F5',
        },
      },
      backgroundImage: {
        'amber-gradient': 'linear-gradient(135deg, #D4A04A 0%, #F59E0B 100%)',
        'card-gradient': 'linear-gradient(145deg, #141416 0%, #1C1C1F 100%)',
        'glass': 'linear-gradient(145deg, rgba(20,20,22,0.8) 0%, rgba(28,28,31,0.6) 100%)',
      },
      backdropBlur: {
        glass: '12px',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(212,160,74,0.3)',
        'glow-lg': '0 0 40px rgba(212,160,74,0.4)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'liquid-wave': 'liquid-wave 3s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'bubble-rise': 'bubble-rise 4s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        'liquid-wave': {
          '0%, 100%': { transform: 'translateX(-25%) translateY(0)' },
          '50%': { transform: 'translateX(25%) translateY(-5px)' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,160,74,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,160,74,0)' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(100%) scale(0)', opacity: '0' },
          '50%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-100px) scale(1.2)', opacity: '0' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
