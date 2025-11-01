/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Matte dark theme
        'matte-dark': '#0B0C0D',
        'matte-card': '#111214',
        'matte-light': '#1A1B1F',
        'matte-border': '#2A2B2F',
        // Cyan accent
        'cyan-accent': '#00E5FF',
        'cyan-hover': '#00B8CC',
        'cyan-dark': '#008BA3',
        // Text colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#B0B0B0',
        'text-muted': '#808080',
      },
      fontFamily: {
        'system': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'matte': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'matte-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}