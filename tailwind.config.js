/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '900px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        danger: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          50: '#FEF2F2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          50: '#FFFBEB',
          500: '#F59E0B',
        },
        success: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          50: '#F0FDF4',
          500: '#16A34A',
        },
        bg: {
          main: 'rgb(var(--bg-main) / <alpha-value>)',
          dark: 'rgb(var(--bg-dark) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          cardHover: 'rgb(var(--bg-card-hover) / <alpha-value>)',
          border: 'rgb(var(--border) / <alpha-value>)',
        },
        text: {
          main: 'rgb(var(--text-main) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        heading: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        button: '12px',
        modal: '24px',
      },
      transitionDuration: {
        fast: '120ms',
        normal: '180ms',
        slow: '260ms',
      },
      boxShadow: {
        glow: '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-danger': '0 0 20px rgba(220, 38, 38, 0.3)',
        'glow-success': '0 0 20px rgba(22, 163, 74, 0.3)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      },
    },
  },
  plugins: [],
}
