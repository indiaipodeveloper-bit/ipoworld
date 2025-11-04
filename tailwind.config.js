/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'] },
      colors: {
        primary: { DEFAULT: '#2D7DD2', 600: '#2568AE', 700: '#1E568F' },
        accent:  { DEFAULT: '#E63946' },
        saffron: { DEFAULT: '#FF9F1C' },
        success: { DEFAULT: '#4CAF50' }
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(2,6,23,.15)'
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' }
    },
     screens: {
      mdx: "759px",
    },
  },
  plugins: []
};