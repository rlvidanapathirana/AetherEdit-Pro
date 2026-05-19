/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#000000',
          900: '#0A0A0A',
          800: '#121212',
          700: '#1A1A1A',
          600: '#222222',
          500: '#2A2A2A',
          400: '#333333',
        },
        cyan: {
          neon: '#00F0FF',
          glow: '#00C8D4',
        },
        violet: {
          electric: '#6366F1',
          glow: '#4F46E5',
        },
        panel: '#0D0D0D',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'panel-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #080808 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00F0FF 0%, #6366F1 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1A1A2E 0%, #000000 100%)',
      },
      backdropBlur: {
        glass: '12px',
        heavy: '20px',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)',
        'neon-violet': '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.1)',
        'panel': '4px 0 24px rgba(0,0,0,0.8)',
        'modal': '0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)',
        'inner-border': 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        'tool-active': '0 0 0 2px #00F0FF, 0 0 12px rgba(0, 240, 255, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 240, 255, 0.7), 0 0 48px rgba(0, 240, 255, 0.3)' },
        },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
    },
  },
  plugins: [],
}
