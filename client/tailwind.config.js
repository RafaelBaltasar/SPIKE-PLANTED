/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14532d', // --primary
          dark: '#0b3d20',    // --primary-dark
          light: '#e8f3eb',   // --primary-light
        },
        background: '#f5f7f6', // --background
        white: '#ffffff',
        text: '#1f2937',      // --text
        muted: '#6b7280',     // --muted
        border: '#e5e7eb',    // --border
        success: '#15803d',   // --success
        warning: '#d97706',   // --warning
        danger: '#dc2626',    // --danger
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.04)',
        'card': '0 2px 12px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}