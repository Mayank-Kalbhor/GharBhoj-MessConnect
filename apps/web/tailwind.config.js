/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#0F6E56',
        'brand-primary-tint': '#0F6E5622',
        'brand-accent': '#BA7517',
        'brand-accent-bg': '#FAEEDA',
        'brand-accent-text': '#854F0B',
        'bg-screen': '#FFFBF3',
        'bg-card': '#FFFFFF',
        'border-default': '#EDE7D8',
        'border-muted': '#D8D2C4',
        'text-primary': '#22302B',
        'text-secondary': '#6B7770',
        'success-bg': '#EAF3DE',
        'success-text': '#3B6D11',
        'danger-bg': '#FCEBEB',
        'danger-text': '#791F1F',
        'danger-border': '#E5B4A2',
        'sidebar-dark': '#22302B',
      },
      borderRadius: {
        'card': '14px',
        'badge': '8px',
        'phone': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
