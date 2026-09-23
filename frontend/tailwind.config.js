/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // App background / main workspace
        canvas: '#F5F7FA',
        ink: '#172033',
        // Sidebar
        sidebar: {
          DEFAULT: '#0B1628',
          hover: '#152238',
          active: '#1C2C47',
          border: '#1E2D45',
          text: '#8B98AF',
          textActive: '#F5F7FA',
        },
        // Safety semantics
        safety: {
          DEFAULT: '#F59E0B',
          light: '#FEF3E2',
        },
        risk: {
          high: '#DC2626',
          highBg: '#FEF2F2',
          medium: '#F59E0B',
          mediumBg: '#FFFBEB',
          low: '#16A34A',
          lowBg: '#F0FDF4',
        },
        ai: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)',
        panel: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}
