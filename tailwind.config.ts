import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        bg: { primary: 'var(--bg-primary)', secondary: 'var(--bg-secondary)', card: 'var(--bg-card)' },
        text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)' },
        neon: {
          blue: 'var(--neon-blue)',
          purple: 'var(--neon-purple)',
          pink: 'var(--neon-pink)',
          indigo: 'var(--neon-indigo)',
        },
      },
    },
  },
  plugins: [],
};
export default config;
