/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: 'var(--app-bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'surface-soft': 'var(--surface-soft)',
        ink: 'var(--text-primary)',
        muted: 'var(--text-secondary)',
        dim: 'var(--text-dim)',
        brand: 'var(--accent-red)',
        'brand-dark': 'var(--accent-red-dark)',
        navy: 'var(--navy-900)',
        'navy-soft': 'var(--navy-850)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        line: 'var(--border-soft)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        shell: '0 12px 28px rgba(18, 22, 50, 0.06)',
        brand: '0 14px 24px rgba(226, 24, 73, 0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};