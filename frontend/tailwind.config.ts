// frontend/tailwind.config.ts — Beergate Design System v4
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: '#060B12',
          primary: '#0A1018',
          secondary: '#111A24',
          tertiary: '#1A2636',
          hover: '#1E2A3A',
          card: '#111A24',
          elevated: '#1A2636',
          surface: '#141A24',
          glass: 'rgba(255,255,255,0.04)',
        },
        accent: {
          DEFAULT: '#F5A623',
          foreground: '#0A1018',
          amber: '#F5A623',
          'amber-dim': '#D4A04A',
          copper: '#D4723C',
          foam: '#FFF3D6',
          hop: '#7CB342',
          malt: '#CB8E4E',
          danger: '#EF5350',
          info: '#42A5F5',
          purple: '#9C6ADE',
        },
        text: {
          primary: '#E8E0D4',
          secondary: '#8B9BB4',
          tertiary: '#5A6B80',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF5350',
          info: '#42A5F5',
          online: '#34D399',
          offline: '#6B7280',
        },
        // Shadcn-compatible
        border: 'rgba(255,255,255,0.06)',
        input: '#1A2636',
        ring: '#F5A623',
        background: '#0A1018',
        foreground: '#E8E0D4',
        primary: {
          DEFAULT: '#F5A623',
          foreground: '#0A1018',
        },
        secondary: {
          DEFAULT: '#1A2636',
          foreground: '#E8E0D4',
        },
        destructive: {
          DEFAULT: '#EF5350',
          foreground: '#E8E0D4',
        },
        muted: {
          DEFAULT: '#111A24',
          foreground: '#8B9BB4',
        },
        popover: {
          DEFAULT: '#1A2636',
          foreground: '#E8E0D4',
        },
        card: {
          DEFAULT: '#111A24',
          foreground: '#E8E0D4',
        },
      },
      backgroundImage: {
        'brew-gradient': 'linear-gradient(135deg, #F5A623 0%, #D4723C 100%)',
        'magic-gradient': 'linear-gradient(135deg, #9C6ADE 0%, #F5A623 100%)',
        'card-gradient': 'linear-gradient(145deg, #111A24 0%, #1A2636 100%)',
        'glass': 'linear-gradient(145deg, rgba(17,26,36,0.85) 0%, rgba(26,38,54,0.6) 100%)',
        'surface-gradient': 'linear-gradient(180deg, rgba(245,166,35,0.03) 0%, transparent 40%)',
      },
      backdropBlur: {
        glass: '16px',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.5rem' }],
        '4xl': ['2.5rem', { lineHeight: '3rem' }],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.3), 0 0 1px rgba(245,166,35,0.1)',
        elevated: '0 8px 32px rgba(0,0,0,0.4), 0 0 1px rgba(245,166,35,0.15)',
        glow: '0 0 20px rgba(245,166,35,0.15)',
        'glow-lg': '0 0 40px rgba(245,166,35,0.25)',
        glass: '0 8px 32px rgba(0,0,0,0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'liquid-wave': 'liquid-wave 3s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'bubble-rise': 'bubble-rise 4s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'liquid-wave': {
          '0%, 100%': { transform: 'translateX(-25%) translateY(0)' },
          '50%': { transform: 'translateX(25%) translateY(-5px)' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,166,35,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245,166,35,0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245,166,35,0.1)' },
          '50%': { boxShadow: '0 0 25px rgba(245,166,35,0.25)' },
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
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
