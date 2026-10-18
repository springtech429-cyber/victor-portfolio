/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['"Orbitron"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        cinzel: ['"Cinzel"', 'serif'],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        neon: {
          blue: 'var(--neon-blue)',
          purple: 'var(--neon-purple)',
          pink: 'var(--neon-pink)',
          indigo: 'var(--neon-indigo)',
        },
      },
      backgroundImage: {
        'blueprint': "linear-gradient(to right, var(--border-neon) 1px, transparent 1px), linear-gradient(to bottom, var(--border-neon) 1px, transparent 1px)",
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'glitch': 'glitch 0.3s cubic-bezier(.25,.46,.45,.94) both infinite',
        'flicker': 'flicker 4s linear infinite',
        'scan': 'scan 3s linear infinite',
      },
      perspective: {
        '1000': '1000px',
        '1200': '1200px',
      },
    },
  },
  plugins: [],
}