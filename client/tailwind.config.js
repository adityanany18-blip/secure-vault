/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1d',
          900: '#101B35',
          800: '#192648',
          700: '#23345d',
        },
        royal: {
          DEFAULT: '#4169E1',
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c7d6fe',
          300: '#a4bcfc',
          400: '#7a9bf9',
          500: '#4169E1',
          600: '#3251ca',
          700: '#283ea2',
          800: '#243482',
          900: '#222f67',
        },
        accent: {
          DEFAULT: '#805AD5',
          light: '#9F7AEA',
          dark: '#6B46C1',
        },
        surface: {
          light: '#F5F7FB',
          dark: '#0B0F19',
          cardLight: '#FFFFFF',
          cardDark: '#131A2A',
        },
        slateText: {
          light: '#1E293B',
          dark: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(16, 27, 53, 0.05)',
        glow: '0 0 25px -5px rgba(65, 105, 225, 0.25)',
      }
    },
  },
  plugins: [],
};

