/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        text: 'var(--text)',
        dim: 'var(--text-dim)',
        faint: 'var(--text-faint)',
      },
      borderColor: {
        hairline: 'var(--border)',
        'hairline-strong': 'var(--border-strong)',
      },
      fontFamily: {
        display: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
