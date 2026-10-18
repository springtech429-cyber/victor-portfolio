import localFont from 'next/font/local';

export const display = localFont({
  src: './fonts/unbounded-latin-wght-normal.woff2',
  variable: '--font-display',
  weight: '200 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
export const body = localFont({
  src: './fonts/hanken-grotesk-latin-wght-normal.woff2',
  variable: '--font-body',
  weight: '100 900',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  adjustFontFallback: 'Arial',
});
export const mono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/jetbrains-mono-latin-500-normal.woff2', weight: '500' },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
  adjustFontFallback: false,
});
