/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wagh: {
          teal: '#0D5C52',
          'teal-dark': '#084039',
          'teal-light': '#14766A',
          gold: '#D4A94F',
          'gold-light': '#E8C57A',
          bg: '#FAF9F6',
          dark: '#1A1A1A',
          muted: '#6B7280',
          success: '#1E8E5A',
          error: '#D64545',
          border: '#E5E3DD',
          surface: '#FFFFFF',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(13, 92, 82, 0.08)',
        'soft-hover': '0 12px 30px -4px rgba(13, 92, 82, 0.16)',
        'teal-glow': '0 0 25px rgba(13, 92, 82, 0.25)',
      }
    },
  },
  plugins: [],
}
